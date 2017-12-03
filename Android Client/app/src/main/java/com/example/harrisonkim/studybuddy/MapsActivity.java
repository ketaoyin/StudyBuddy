package com.example.harrisonkim.studybuddy;

import android.os.Bundle;
import android.support.v4.app.FragmentActivity;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.CameraPosition;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class MapsActivity extends FragmentActivity implements OnMapReadyCallback {

    private GoogleMap mMap;
    String name = null;
    String rating = null;
    String year = null;
    String major = null;
    String userID = null;
    String location = null;
    String distance = null;

    String localjsonString = null;
    String mylocation = null;
    String myLat = null;
    String myLng = null;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_maps);
        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);
        Bundle bundle = getIntent().getExtras();
        if (bundle != null) {
            localjsonString = bundle.getString("matches");
            myLat = bundle.getString("lat");
            myLng = bundle.getString("lng");
        }
    }


    /**
     * Manipulates the map once available.
     * This callback is triggered when the map is ready to be used.
     * This is where we can add markers or lines, add listeners or move the camera. In this case,
     * we just add a marker near Sydney, Australia.
     * If Google Play services is not installed on the device, the user will be prompted to install
     * it inside the SupportMapFragment. This method will only be triggered once the user has
     * installed Google Play services and returned to the app.
     */
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        // Add a marker in Tech Green and move the camera
        // double lat = -84.3973;
        // double lng = 33.7746;

        double latitude1 = Double.valueOf(myLat);
        double longitude1 = Double.valueOf(myLng);

        LatLng campus = new LatLng(latitude1,longitude1);
        mMap.addMarker(new MarkerOptions().position(campus).title("You are Here!").icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_BLUE)));
        // center it at your location
        mMap.moveCamera(CameraUpdateFactory.newLatLng(campus));
        if (campus != null)
        {
            // mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(new LatLng(campus.getLatitude(), campus.getLongitude()), 13));

            CameraPosition cameraPosition = new CameraPosition.Builder()
                    .target(new LatLng(latitude1, longitude1))    // Sets the center of the map to location user
                    .zoom(18)                   // Sets the zoom
                    .bearing(90)                // Sets the orientation of the camera to east
                    .tilt(35)                   // Sets the tilt of the camera to 30 degrees
                    .build();                   // Creates a CameraPosition from the builder
            mMap.animateCamera(CameraUpdateFactory.newCameraPosition(cameraPosition));
        }

        try{
            JSONObject jsonResponse = new JSONObject(localjsonString);
            JSONArray jsonMainNode = jsonResponse.optJSONArray("match");
            LatLng[] point_new = new LatLng[jsonMainNode.length()];
            for(int i = 0; i<jsonMainNode.length();i++){
                JSONObject jsonChildNode = jsonMainNode.getJSONObject(i);

                String names = jsonChildNode.optString("Name");
                String majors = jsonChildNode.optString("Major");
                String years = jsonChildNode.optString("Year");
                String ratings = jsonChildNode.optString("Rating");

                JSONArray coorArray = jsonChildNode.getJSONArray("Location");

                double latitude = coorArray.getDouble(0);
                double longitude = coorArray.getDouble(1);
                LatLng userCoord = new LatLng(longitude, latitude);

                point_new[i] = userCoord;
                mMap.addMarker(new MarkerOptions().title(names).snippet("Major: " + majors + " | Year: " + years + " | Rating: " + ratings).position(point_new[i]).icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)));



            }


        }
        catch(JSONException e){
            //Toast.makeText(getApplicationContext(), "Error"+e.toString(), Toast.LENGTH_SHORT).show();
        }



    }


}