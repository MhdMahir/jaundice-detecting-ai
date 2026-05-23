from pathlib import Path

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
import numpy as np
from PIL import Image
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)

#CORS(app)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# -------------------------
# Load EfficientNet
# -------------------------
cnn = models.efficientnet_b0(weights=None)
feature_extractor = cnn.features.to(device)
feature_extractor.eval()

# -------------------------
# GCN model
# -------------------------
class GCN(nn.Module):
    def __init__(self, in_features, hidden_dim, num_classes):
        super(GCN, self).__init__()
        self.fc1 = nn.Linear(in_features, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, num_classes)

    def forward(self, X, A):
        X = A @ X
        X = self.fc1(X)
        X = F.relu(X)
        X = A @ X
        X = self.fc2(X)
        return X

model_gcn = GCN(1280, 256, 2).to(device)

# -------------------------
# Load trained weights
# -------------------------
checkpoint = torch.load("jaundice_model.pth", map_location=device)

feature_extractor.load_state_dict(checkpoint["feature_extractor"])
model_gcn.load_state_dict(checkpoint["gcn"])

X = checkpoint["X"]
A = checkpoint["A"]

model_gcn.eval()

# -------------------------
# Image transform
# -------------------------
transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485,0.456,0.406],
        [0.229,0.224,0.225]
    )
])

classes = ["Jaundice Positive", "Jaundice Negative"]

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

# -------------------------
# Prediction API
# -------------------------
@app.route("/predict", methods=["POST"])
def predict():

    if "images" not in request.files:
        return jsonify({"error":"No images uploaded"}),400

    files = request.files.getlist("images")

    prob_list = []

    for file in files:

        image = Image.open(file).convert("RGB")
        img = transform(image).unsqueeze(0).to(device)

        # -------- Feature extraction --------
        with torch.no_grad():
            feat = feature_extractor(img)
            feat = F.adaptive_avg_pool2d(feat,(1,1)).reshape(1,-1)

        feat = feat.cpu()

        # -------- Graph connection --------
        X_new = torch.cat([X,feat],dim=0)

        sim = cosine_similarity(feat.numpy(),X.numpy())

        k = 10
        idx = np.argsort(sim[0])[-k:]

        A_new = A.clone().numpy()

        A_exp = np.zeros((A_new.shape[0]+1,A_new.shape[1]+1))
        A_exp[:-1,:-1] = A_new

        for i in idx:
            A_exp[-1,i] = sim[0][i]
            A_exp[i,-1] = sim[0][i]

        A_exp[-1,-1] = 1

        A_exp = torch.tensor(A_exp,dtype=torch.float32)

        # -------- Normalize adjacency --------
        D = torch.diag(torch.sum(A_exp,dim=1))
        D_inv_sqrt = torch.linalg.inv(torch.sqrt(D))
        A_norm = D_inv_sqrt @ A_exp @ D_inv_sqrt

        # -------- GCN prediction --------
        with torch.no_grad():
            out = model_gcn(X_new.to(device),A_norm.to(device))
            probs_tensor = torch.softmax(out[-1],dim=0)

        # Save probabilities
        prob_list.append(probs_tensor.cpu().numpy())

        print("Raw probabilities:", probs_tensor)

    # -------------------------
    # Average probabilities
    # -------------------------
    prob_array = np.array(prob_list)
    avg_probs = prob_array.mean(axis=0)

    pred_class = np.argmax(avg_probs)
    prediction = classes[pred_class]

    confidence = float(avg_probs[pred_class])

    return jsonify({
        "prediction": prediction,
        "confidence": confidence,
        "images_used": len(files)
    })

# -------------------------
# Start server
# -------------------------


@app.route("/")
@app.route("/index")
def root():
    return render_template("index.html")

@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/signup")
def signup():
    return render_template("signup.html")


@app.route("/upload")
def upload():
    return render_template("upload.html")


@app.route("/profile")
def profile():
    return render_template("profile.html")


@app.route("/result")
def result():
    return render_template("result.html")


@app.route("/forgot-password")
def forgot_password():
    return render_template("forgot-password.html")


@app.route("/learn-more")
def learn_more():
    return render_template("learn-more.html")


@app.route("/history")
@app.route("/history.html")
def history():
    return render_template("history.html")


if __name__ == "__main__":
    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )
