import json

import requests
from flask import Flask, jsonify, request

app = Flask(__name__)

CACHE_FILE = "/tmp/geo_cache.json"


@app.get("/")
def locate():
    ip = request.args.get("ip")
    if not ip:
        return jsonify({"error": "IP address required"}), 400

    try:
        parts = ip.split(".")
        if len(parts) != 4:
            raise ValueError("Invalid IP format")
        for part in parts:
            num = int(part)
            if num < 0 or num > 255:
                raise ValueError("Invalid IP format")
    except (ValueError, AttributeError):
        return jsonify({"error": "Invalid IP address format"}), 400

    url = f"http://ip-api.com/json/{ip}"
    try:
        response = requests.get(url, timeout=5).json()
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to fetch geolocation: {str(e)}"}), 500

    if response.get("status") != "success":
        return jsonify({"error": "Invalid IP or API error. IP may not be routable."}), 400

    data = {
        "ip": ip,
        "country": response.get("country"),
        "region": response.get("regionName"),
        "city": response.get("city"),
        "isp": response.get("isp"),
        "lat": response.get("lat"),
        "lon": response.get("lon"),
        "timezone": response.get("timezone"),
        "as": response.get("as"),
        "org": response.get("org"),
    }

    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f)

    return jsonify(data)

