package com.example.harrisonkim.studybuddy;


import android.Manifest;
import android.app.AlertDialog;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.RequiresApi;
import android.support.v4.app.ActivityCompat;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemSelectedListener;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;

import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.toolbox.Volley;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import java.net.InetAddress;
import java.util.GregorianCalendar;

import static java.lang.Boolean.TRUE;

public class findbuddy extends AppCompatActivity implements OnItemSelectedListener {

    String classid;
    String lat, lng;
    String group;

    long start = 0;
    long finish = 0;

    @RequiresApi(api = Build.VERSION_CODES.M)
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_findbuddy);

        final EditText etDistance = (EditText) findViewById(R.id.etDistance);
        //final EditText etUserID = (EditText) findViewById(R.id.etUserID);
        final Button bSearch = (Button) findViewById(R.id.bSearch);
        final CheckBox checkBox = (CheckBox) findViewById(R.id.checkBox);

        final Boolean checkBoxState = checkBox.isChecked();

        group = "Individual";
        checkBox.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v){
                if(((CheckBox)v).isChecked())
                    group = "Group";

            }
        });

        Intent intent = getIntent();
        final String userID = intent.getStringExtra("userID");


        Spinner spinner = (Spinner) findViewById(R.id.spinner);
        // Spinner click listener
        spinner.setOnItemSelectedListener(this);


        // Spinner Drop down elements
        List<String> categories = new ArrayList<String>();
        categories.add("BIO1510");
        categories.add("CEE2040");
        categories.add("CH1310");
        categories.add("CH2311");
        categories.add("CH2312");
        categories.add("CS3251");
        categories.add("CS3451");
        categories.add("CS4235");
        categories.add("CS4261");
        categories.add("CS4400");
        categories.add("CS4460");
        categories.add("CS4641");
        categories.add("CS6505");
        categories.add("CS6601");
        categories.add("CS8803");
        categories.add("CSE6010");
        categories.add("CSE6242");
        categories.add("ISYE3770");
        categories.add("PY2211");
        categories.add("PY2213");


        // Creating adapter for spinner
        ArrayAdapter<String> dataAdapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_item, categories);

        // Drop down layout style - list view with radio button
        dataAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);

        // attaching data adapter to spinner
        spinner.setAdapter(dataAdapter);

        ActivityCompat.requestPermissions(findbuddy.this, new String[] {Manifest.permission.ACCESS_FINE_LOCATION}, 123);

        bSearch.setOnClickListener(new View.OnClickListener(){
            @Override
            public void onClick (View v){
                final String radius = etDistance.getText().toString(); //multiply by .3048 to get meters
                double radius_conversion = (Double.parseDouble(radius))*0.3048;
                final String radius_meters = Double.toString(radius_conversion);
                GPStracker gt = new GPStracker(getApplicationContext());
                Location l = gt.getLocation();
                if( l == null){
                    Toast.makeText(getApplicationContext(),"GPS unable to get Value",Toast.LENGTH_SHORT).show();
                }else {
                    double latitude = l.getLatitude();
                    double longitude = l.getLongitude();
                    lat = Double.toString(latitude);
                    lng = Double.toString(longitude);

                }



                Response.Listener<String> responseListener = new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {

                        try {
                            JSONObject jsonResponse = new JSONObject(response);
                            if  (jsonResponse.has("Status")){
                                AlertDialog.Builder builder = new AlertDialog.Builder(findbuddy.this);
                                builder.setMessage("Search Failed")
                                        .setNegativeButton("Retry", null)
                                        .create()
                                        .show();
                            }


                            else if (jsonResponse.has("Msg")) {
                                Toast.makeText(getApplicationContext(),"No Matches Found",Toast.LENGTH_LONG).show();
                            }

                            else{
//                                System.out.println(jsonResponse.toString());
//
                                JSONArray matches = jsonResponse.getJSONArray("Matches");
                                String output = matches.toString();

                                Intent intent = new Intent(findbuddy.this, Matches.class);
                                intent.putExtra("matches", output);
                                intent.putExtra("myid", userID);
                                intent.putExtra("lat", lat);
                                intent.putExtra("lng", lng);
                                intent.putExtra("Group",group);

                                finish = new GregorianCalendar().getTimeInMillis();
//                                System.out.println("Ping RTT: " + (finish - start + "ms"));
                                Log.i("RTT", "Ping RTT: " + (finish - start + "ms"));

                                findbuddy.this.startActivity(intent);
                            }
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }


                    }
                };
                start = new GregorianCalendar().getTimeInMillis();
                findbuddyRequest fbRequest = new findbuddyRequest(userID,classid,radius_meters,lat,lng, group, responseListener);
                RequestQueue queue = Volley.newRequestQueue(findbuddy.this);
                queue.add(fbRequest);
            }
        });

    }

    @Override
    public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
        // On selecting a spinner item
        classid = parent.getItemAtPosition(position).toString();

        // Showing selected spinner item
        Toast.makeText(parent.getContext(), "Selected: " + classid, Toast.LENGTH_LONG).show();
    }
    public void onNothingSelected(AdapterView<?> arg0) {
        // TODO Auto-generated method stub
    }


}