package com.example.harrisonkim.studybuddy;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.Menu;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.ListView;
import android.widget.SimpleAdapter;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.RequestFuture;
import com.android.volley.toolbox.Volley;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;



/**
 * Created by Christian on 11/12/2017.
 */

public class Matches extends AppCompatActivity{

    String name = null;
    String rating = null;
    String year = null;
    String major = null;
    String userID = null;
    String location = null;
    String distance = null;
    String response = null;
    String groupid1 = null;
    String chatport1 = null;

    String name2 = null;
    String rating2 = null;
    String year2 = null;
    String major2 = null;
    String userID2 = null;
    String location2 = null;
    String distance2 = null;
    String chatport2 = null;
    String groupid2 = null;

    String status = null;


    String localjsonString = null;
    String myid = null;
    Intent intent3 = null;
    int wait;
    String url = null;
    String new_port = null;
    String myLat = null;
    String myLng = null;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_matches);

        final Button map = (Button) findViewById(R.id.map);
        Bundle bundle =getIntent().getExtras();
        if (bundle != null){
            localjsonString = bundle.getString("matches");
            localjsonString = "{\"match\":" + localjsonString + "}";
            String group_status = bundle.getString("Group");


            if (group_status.equals("Group")){

                JSONArray tempArray = new JSONArray();

                try {

                    JSONObject group_matches = new JSONObject(localjsonString);
                    JSONArray matches = group_matches.optJSONArray("match");
                    for(int i = 0; i<matches.length();i++) {
                        JSONObject group = matches.getJSONObject(i);
                        JSONObject leader = group.getJSONObject("Leader");
                        tempArray.put(leader);

                    }
                    String temp_matches = tempArray.toString();
                    localjsonString = temp_matches;
                    localjsonString = "{\"match\":" + localjsonString + "}";

                } catch (JSONException e) {
                    e.printStackTrace();
                }

            }
            myLat = bundle.getString("lat");
            myLng = bundle.getString("lng");
            myid = bundle.getString("myid");
        }
        final RequestQueue queue = Volley.newRequestQueue(Matches.this);
        url = "http://143.215.84.147:3000/acceptPhase/receiveMsgFromServer?userid="+myid;

        wait = 0;
        status = "searching";
        RecievingRequest();


        initList();

        map.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent mapIntent = new Intent(Matches.this, MapsActivity.class);
                mapIntent.putExtra("lng", myLng);
                mapIntent.putExtra("lat", myLat);
                mapIntent.putExtra("matches", localjsonString);
                Matches.this.startActivity(mapIntent);
            }
        });




        final ListView listView = (ListView) findViewById(R.id.list_view);
        SimpleAdapter simpleAdapter = new SimpleAdapter(this, matchesList, android.R.layout.simple_list_item_1, new String[] {"match"}, new int[] {android.R.id.text1});
        listView.setAdapter(simpleAdapter);
        listView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {

                JSONObject jsonResponse = null;
                try {
                    jsonResponse = new JSONObject(localjsonString);
                    JSONArray jsonMainNode = jsonResponse.optJSONArray("match");

                    JSONObject jsonChildNode = jsonMainNode.getJSONObject(i);

                    name = jsonChildNode.optString("Name");
                    rating = jsonChildNode.optString("Rating");
                    year = jsonChildNode.optString("Year");
                    major = jsonChildNode.optString("Major");
                    userID = jsonChildNode.optString("UserID");
                    location = jsonChildNode.optString("Location");
                    distance = jsonChildNode.optString("Distance away(m)");



                } catch (JSONException e) {
                    e.printStackTrace();
                }
                Response.Listener<String> listener = new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {

                            Toast.makeText(getApplicationContext(), "Request Sent. Please wait for response.", Toast.LENGTH_LONG).show();




                    }
                };

                matchesRequest mRequest = new matchesRequest(myid,userID,listener);
                queue.add(mRequest);


            }
        });



    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        return true;
    }

    List<Map<String,String>> matchesList = new ArrayList<Map<String,String>>();
    private void initList(){

        try{
            JSONObject jsonResponse = new JSONObject(localjsonString);
            JSONArray jsonMainNode = jsonResponse.optJSONArray("match");

            for(int i = 0; i<jsonMainNode.length();i++){
                JSONObject jsonChildNode = jsonMainNode.getJSONObject(i);
                String entry_number = String.valueOf(i + 1);
                String name = jsonChildNode.optString("Name");
                String number = jsonChildNode.optString("Rating");
                String year = jsonChildNode.optString("Year");
                String major = jsonChildNode.optString("Major");
                String outPut = entry_number + ":" + name + ", " +number + ", " + major + ", " +year;
                matchesList.add(createEmployee("match", outPut));
            }
        }
        catch(JSONException e){
            Toast.makeText(getApplicationContext(), "Error"+e.toString(), Toast.LENGTH_SHORT).show();
        }
    }

    private HashMap<String, String> createEmployee(String name, String number){
        HashMap<String, String> employeeNameNo = new HashMap<String, String>();
        employeeNameNo.put(name, number);
        return employeeNameNo;
    }

    public void RecievingRequest() {
        Thread threadA = new Thread() {
            public void run() {
                ThreadB threadB = new ThreadB(getApplicationContext());
                JSONObject jsonObject = null;
                try {
                    jsonObject = threadB.execute().get(60,TimeUnit.MINUTES);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } catch (ExecutionException e) {
                    e.printStackTrace();
                }
                catch (TimeoutException e) {
                    e.printStackTrace();
                }
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        wait = 1;
                    }
                });
                final JSONObject receivedJSONObject = jsonObject;

                if (receivedJSONObject != null){
                    if (receivedJSONObject.has("Response")){
                        try {
                            response = receivedJSONObject.getString("Response");
                            new_port = receivedJSONObject.getString("UserPortNum");

                            if (response.equals("0")){
                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        Toast.makeText(getApplicationContext(), "Sorry. Your request was denied. Please select another match.", Toast.LENGTH_SHORT).show();
                                        wait = 0;


                                    }

                                });

                            }
                            if (response.equals("1")){
                                try {
                                    groupid1 = receivedJSONObject.getString("NewGroupID");
                                    chatport1 = receivedJSONObject.getString("NewChatPort");
                                    new_port = receivedJSONObject.getString("UserPortNum");





                                } catch (JSONException e) {
                                    e.printStackTrace();
                                }

                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        Toast.makeText(getApplicationContext(), "Your request was accepted.", Toast.LENGTH_SHORT).show();
                                        final Intent intent2 = new Intent(Matches.this, Accepted.class);
                                        intent2.putExtra("name",name);
                                        intent2.putExtra("rating",rating);
                                        intent2.putExtra("year",year);
                                        intent2.putExtra("major",major);
                                        intent2.putExtra("userID",userID);
                                        intent2.putExtra("location",location);
                                        intent2.putExtra("groupID", groupid1);
                                        intent2.putExtra("chat", chatport1);
                                        intent2.putExtra("url",url);
                                        intent2.putExtra("myid",myid);

                                        status = "accept";
                                        Matches.this.startActivity(intent2);
                                    }

                                });

                            }



                        } catch (JSONException e) {
                            e.printStackTrace();
                        }

                    }
                    else{


                        try {
                            name2 = receivedJSONObject.getString("Name");
                            rating2 = receivedJSONObject.getString("Rating");
                            year2 = receivedJSONObject.getString("Year");
                            major2 = receivedJSONObject.getString("Major");
                            location2 = receivedJSONObject.getString("Location");
                            chatport2 = receivedJSONObject.getString("NewChatPort");
                            groupid2 = receivedJSONObject.getString("NewGroupID");
                            userID2 = receivedJSONObject.getString("UserID");
                            new_port = receivedJSONObject.getString("UserPortNum");


                        } catch (JSONException e) {
                            e.printStackTrace();
                        }

                        intent3 = new Intent(Matches.this, Accepted.class);
                        intent3.putExtra("name",name2);
                        intent3.putExtra("rating",rating2);
                        intent3.putExtra("year",year2);
                        intent3.putExtra("major",major2);
                        intent3.putExtra("location",location2);
                        intent3.putExtra("groupID", groupid2);
                        intent3.putExtra("chat", chatport2);
                        intent3.putExtra("userid",userID2);
                        intent3.putExtra("myid",myid);

                        if(name2 != null && rating2 != null && year2 != null && major2 != null && location2 != null && chatport2 != null && groupid2 != null && userID2 != null){

                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    final Response.Listener<String> listener = new Response.Listener<String>() {
                                        @Override
                                        public void onResponse(String response) {

                                            Toast.makeText(getApplicationContext(), "Response Sent.", Toast.LENGTH_LONG).show();



                                        }
                                    };
                                    wait = 1;
                                    AlertDialog.Builder decision_button = new AlertDialog.Builder(Matches.this);
                                    decision_button.setMessage("Name: " + name2 + "\nMyID: " + myid + "\nUserID: " + userID2 +"\nGroupid: " + groupid2 + " \nchatport: " + chatport2)
                                            .setPositiveButton("Accept", new DialogInterface.OnClickListener() {
                                                @Override
                                                public void onClick(DialogInterface dialogInterface, int i) {

                                                    Response.ErrorListener Error = new Response.ErrorListener() {
                                                        @Override
                                                        public void onErrorResponse(VolleyError error) {
                                                            Log.d("Error.Response",error.toString());
                                                        }
                                                    };

                                                    matchesAcceptRequest aRequest = new matchesAcceptRequest("1",groupid2,chatport2,myid,userID2,listener);
                                                    RequestQueue queue2 = Volley.newRequestQueue(Matches.this);
                                                    queue2.add(aRequest);
                                                    status = "accept";
                                                    wait = 0;
                                                    if (status == "accept"){
                                                        Matches.this.startActivity(intent3);
                                                    }

                                                    dialogInterface.cancel();

                                                }
                                            })
                                            .setNegativeButton("Decline", new DialogInterface.OnClickListener() {
                                                @Override
                                                public void onClick(DialogInterface dialogInterface, int i) {

                                                    Response.ErrorListener Error = new Response.ErrorListener() {
                                                        @Override
                                                        public void onErrorResponse(VolleyError error) {
                                                            Log.d("Error.Response",error.toString());
                                                        }
                                                    };

                                                    matchesDeclineRequest aRequest = new matchesDeclineRequest("0",myid,userID2,listener);
                                                    RequestQueue queue2 = Volley.newRequestQueue(Matches.this);
                                                    queue2.add(aRequest);
                                                    status = "decline";
                                                    wait = 0;
                                                    RecievingRequest();
                                                    dialogInterface.cancel();

                                                }
                                            })
                                            .create()
                                            .show();





                                }

                            });
                        }
                    }

                }
                if (receivedJSONObject == null){
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            wait = 0;
                            RecievingRequest();
                        }
                    });

                }

            }


        };
        threadA.start();
    }

    private class ThreadB extends AsyncTask<Void, Void, JSONObject> {
        private Context mContext;

        public ThreadB(Context ctx) {
            mContext = ctx;
        }

        @Override
        protected JSONObject doInBackground(Void... params) {
            final RequestFuture<JSONObject> futureRequest = RequestFuture.newFuture();
            RequestQueue mQueue = Volley.newRequestQueue(Matches.this);
            final JsonObjectRequest jsonRequest = new JsonObjectRequest(Request.Method
                    .GET, url,
                    new JSONObject(), futureRequest, futureRequest);
            mQueue.add(jsonRequest);

            try {
                return futureRequest.get(60,TimeUnit.MINUTES);
            } catch (InterruptedException e) {
                e.printStackTrace();
            } catch (ExecutionException e) {
                e.printStackTrace();
            }
            catch (TimeoutException e) {
                e.printStackTrace();
            }
            return null;
        }
    }

}

