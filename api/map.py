import folium
import json
import os

from flask import Flask, Response, jsonify

app = Flask(__name__)

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
    
    return m._repr_html_()

@app.get("/")
def handler():
    # Cached data written by `api/locate.py`
    data_file = "/tmp/geo_cache.json"

    if not os.path.exists(data_file):
        return jsonify({"error": "Map not generated yet. Please locate an IP first."}), 400

    with open(data_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    html = create_map(data)
    return Response(html, mimetype="text/html")