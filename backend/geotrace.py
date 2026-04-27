from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
import folium
import os

app = Flask(__name__)
CORS(app)

geo_cache = {}

@app.route("/health")
@app.route("/api/health")
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "GeoTrace API"})

@app.route("/locate")
@app.route("/api/locate")
def locate():
    """Geolocate an IP address"""
    ip = request.args.get("ip")
    
    if not ip:
        return jsonify({"error": "IP address required"}), 400
    
    # Validate IP format
    try:
        parts = ip.split('.')
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
        "org": response.get("org")
    }

    geo_cache["data"] = data
    create_map(data)

    return jsonify(data)

def create_map(data):
    """Create an interactive Folium map"""
    m = folium.Map(
        location=[data['lat'], data['lon']], 
        zoom_start=10,
        tiles='CartoDB dark_matter'
    )
    
    # Add marker with popup
    folium.Marker(
        [data['lat'], data['lon']],
        popup=folium.Popup(
            f"""
            <div style="font-family: Arial, sans-serif; min-width: 200px;">
                <h4 style="margin: 0 0 10px 0; color: #0ea5e9;">{data['ip']}</h4>
                <p style="margin: 5px 0;"><strong>Location:</strong> {data['city']}, {data['region']}</p>
                <p style="margin: 5px 0;"><strong>Country:</strong> {data['country']}</p>
                <p style="margin: 5px 0;"><strong>ISP:</strong> {data['isp']}</p>
                <p style="margin: 5px 0;"><strong>Timezone:</strong> {data['timezone']}</p>
            </div>
            """,
            max_width=300
        ),
        tooltip=f"{data['city']}, {data['country']}"
    ).add_to(m)
    
    # Add circle for region visualization
    folium.Circle(
        [data['lat'], data['lon']],
        radius=10000,
        color='#0ea5e9',
        fill=True,
        fillColor='#0ea5e9',
        fillOpacity=0.1
    ).add_to(m)
    
    m.save("map.html")

@app.route("/map")
@app.route("/api/map")
def get_map():
    try:
        return send_file("map.html")
    except FileNotFoundError:
        return jsonify({"error": "Map not generated yet. Please locate an IP first."}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5000)
