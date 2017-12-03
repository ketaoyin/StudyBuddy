package com.example.harrisonkim.studybuddy;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.RequestFuture;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public class Accepted extends AppCompatActivity {

    String myid = null;
    String groupid = null;
    int wait;
    String type = null;

    String chatport2 = null;
    String groupid2 = null;
    String userID2 = null;
    String new_port = null;

    String name3 = null;
    String rating3 = null;
    String year3 = null;
    String major3 = null;
    String location3 = null;
    String chatport3 = null;
    String groupid3 = null;
    String userID3 = null;
    String new_port3 = null;
    String status = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_accepted);

        final EditText etName = (EditText) findViewById(R.id.editText);
        final EditText etYear = (EditText) findViewById(R.id.editText2);
        final EditText etMajor = (EditText) findViewById(R.id.editText4);
        final EditText etRating = (EditText) findViewById(R.id.editText3);

        Intent intent = getIntent();
        String rating = intent.getStringExtra("rating");
        String name = intent.getStringExtra("name");
        String year = intent.getStringExtra("year");
        String major = intent.getStringExtra("major");
        final String chat = intent.getStringExtra("chat");
        myid = intent.getStringExtra("myid");
        groupid = intent.getStringExtra("groupID");

        etRating.setText(rating);
        etYear.setText(year);
        etMajor.setText(major);
        etName.setText(name);

        status = "stay";
        final Timer t = new Timer();
        RecievingRequest();



        final Button chat_button = (Button) findViewById(R.id.button2);
        chat_button.setOnClickListener(new View.OnClickListener(){
            @Override
            public void onClick(View view) {
                String url = "http://143.215.84.147:"+chat;
                Uri uri = Uri.parse(url); // missing 'http://' will cause crashed
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(intent);
            }
        });
        final Button leave_button = (Button) findViewById(R.id.button3);
        leave_button.setOnClickListener(new View.OnClickListener() {



            @Override
            public void onClick(View view) {

                final Response.Listener<String> listener = new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {

                        Toast.makeText(getApplicationContext(), "Response Sent.", Toast.LENGTH_LONG).show();



                    }
                };

                leaveRequest leaveRequest = new leaveRequest(myid, groupid,listener);

                // Add the request to the RequestQueue.
                RequestQueue queue = Volley.newRequestQueue(Accepted.this);
                queue.add(leaveRequest);
                status = "exit";
                Intent intent = new Intent(Accepted.this, findbuddy.class);
                intent.putExtra("userID",myid);
                Accepted.this.startActivity(intent);
            }

        });

    }

    public void RecievingRequest() {
        Thread threadA = new Thread() {
            public void run() {
                Accepted.ThreadB threadB = new Accepted.ThreadB(getApplicationContext());
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

                    if (receivedJSONObject.has("Type")){
                        try {
                            type = receivedJSONObject.getString("Type");
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }

                        if(type.equals("Departure")){
                            try {
                                if (receivedJSONObject.has("NewChatPort")){
                                    chatport2 = receivedJSONObject.getString("NewChatPort");
                                    groupid2 = receivedJSONObject.getString("GroupID");
                                    userID2 = receivedJSONObject.getString("UserID");
                                    new_port = receivedJSONObject.getString("UserPortNum");

                                    JSONObject new_leader = receivedJSONObject.getJSONObject("LeaderProfile");

                                    final String leader_name = new_leader.getString("Name");
                                    final String leader_rating = new_leader.getString("Rating");
                                    final String leader_year = new_leader.getString("Year");
                                    final String leader_major = new_leader.getString("Major");
                                    ///popup with new intent to reload page
                                    runOnUiThread(new Runnable() {
                                        @Override
                                        public void run() {
                                            AlertDialog.Builder alert = new AlertDialog.Builder(Accepted.this);

                                            alert.setTitle("End Session");
                                            alert.setMessage("A member has left your group. Please rate them.");

                                            final EditText input = new EditText(Accepted.this);
                                            alert.setView(input);

                                            alert.setPositiveButton("OK", new DialogInterface.OnClickListener(){
                                                public void onClick(DialogInterface dialog, int whichButton){
                                                    status = "exit";
                                                    String rating = input.getText().toString();
                                                    final Response.Listener<String> listener = new Response.Listener<String>() {
                                                        @Override
                                                        public void onResponse(String response) {

                                                            Toast.makeText(getApplicationContext(), "Rating Sent.", Toast.LENGTH_SHORT).show();
                                                        }
                                                    };
                                                    ratingRequest rRequest = new ratingRequest(myid,userID2,rating,listener);
                                                    RequestQueue queue2 = Volley.newRequestQueue(Accepted.this);
                                                    queue2.add(rRequest);
                                                    Intent intent = new Intent(Accepted.this, Accepted.class);
                                                    intent.putExtra("name",leader_name);
                                                    intent.putExtra("rating",leader_rating);
                                                    intent.putExtra("year",leader_year);
                                                    intent.putExtra("major",leader_major);
                                                    intent.putExtra("userID",userID2);
                                                    intent.putExtra("groupID", groupid2);
                                                    intent.putExtra("chat", chatport2);
                                                    intent.putExtra("myid",myid);

                                                    Accepted.this.startActivity(intent);


                                                }
                                            });

                                            alert.show();
                                        }
                                    });
                                }
                                else{
                                    userID2 = receivedJSONObject.getString("UserID");

                                    runOnUiThread(new Runnable() {
                                        @Override
                                        public void run() {
                                            AlertDialog.Builder alert = new AlertDialog.Builder(Accepted.this);

                                            alert.setTitle("End Session");
                                            alert.setMessage("A member has left your group. Please rate them.");

                                            final EditText input = new EditText(Accepted.this);
                                            alert.setView(input);

                                            alert.setPositiveButton("OK", new DialogInterface.OnClickListener(){
                                                public void onClick(DialogInterface dialog, int whichButton){

                                                    String rating = input.getText().toString();
                                                    final Response.Listener<String> listener = new Response.Listener<String>() {
                                                        @Override
                                                        public void onResponse(String response) {

                                                            Toast.makeText(getApplicationContext(), "Rating Sent.", Toast.LENGTH_SHORT).show();
                                                        }
                                                    };
                                                    ratingRequest rRequest = new ratingRequest(myid,userID2,rating,listener);
                                                    RequestQueue queue2 = Volley.newRequestQueue(Accepted.this);
                                                    queue2.add(rRequest);
                                                    RecievingRequest();
                                                    wait = 0;

                                                }
                                            });

                                            alert.show();
                                        }
                                    });




                                }

                            } catch (JSONException e) {
                                e.printStackTrace();
                            }

                        }
                        else{
                            try {
                                userID2 = receivedJSONObject.getString("UserID");
                            } catch (JSONException e) {
                                e.printStackTrace();
                            }
                            runOnUiThread(new Runnable() {


                                @Override
                                public void run() {

//                                    Toast.makeText(getApplicationContext(), "Something was received." + userID2, Toast.LENGTH_LONG).show();
//                                    System.out.println(userID2);

                                    AlertDialog.Builder alert = new AlertDialog.Builder(Accepted.this);

                                    alert.setTitle("End Session");
                                    alert.setMessage("Your group has ended. Please Rate your partner.");

                                    final EditText input = new EditText(Accepted.this);
                                    alert.setView(input);

                                    alert.setPositiveButton("OK", new DialogInterface.OnClickListener(){
                                        public void onClick(DialogInterface dialog, int whichButton){

                                            String rating = input.getText().toString();
                                            final Response.Listener<String> listener = new Response.Listener<String>() {
                                                @Override
                                                public void onResponse(String response) {

                                                    Toast.makeText(getApplicationContext(), "Rating Sent.", Toast.LENGTH_SHORT).show();
                                                }
                                            };
//                                            Toast.makeText(getApplicationContext(),rating,Toast.LENGTH_LONG);
                                            ratingRequest rRequest = new ratingRequest(myid,userID2,rating,listener);
                                            RequestQueue queue2 = Volley.newRequestQueue(Accepted.this);
                                            queue2.add(rRequest);
                                            wait = 0;
                                            status = "exit";
                                            Intent intent = new Intent(Accepted.this, findbuddy.class);
                                            intent.putExtra("userID",myid);
                                            Accepted.this.startActivity(intent);

                                        }
                                    });

                                    alert.show();
                                }
                            });

                        }



                    }
                    else{


                        try {
                            name3 = receivedJSONObject.getString("Name");
                            rating3 = receivedJSONObject.getString("Rating");
                            year3 = receivedJSONObject.getString("Year");
                            major3 = receivedJSONObject.getString("Major");
                            location3 = receivedJSONObject.getString("Location");
                            chatport3 = receivedJSONObject.getString("NewChatPort");
                            groupid3 = receivedJSONObject.getString("NewGroupID");
                            userID3 = receivedJSONObject.getString("UserID");
                            new_port3 = receivedJSONObject.getString("UserPortNum");


                        } catch (JSONException e) {
                            e.printStackTrace();
                        }


                        if(name3 != null && rating3 != null && year3 != null && major3 != null && location3 != null && chatport3 != null && groupid3 != null && userID3 != null){

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
                                    AlertDialog.Builder decision_button = new AlertDialog.Builder(Accepted.this);
                                    decision_button.setMessage("Name: " + name3 + "\nMyID: " + myid + "\nUserID: " + userID3 +"\nGroupid: " + groupid3 + " \nchatport: " + chatport3)
                                            .setPositiveButton("Accept", new DialogInterface.OnClickListener() {
                                                @Override
                                                public void onClick(DialogInterface dialogInterface, int i) {

                                                    Response.ErrorListener Error = new Response.ErrorListener() {
                                                        @Override
                                                        public void onErrorResponse(VolleyError error) {
                                                            Log.d("Error.Response",error.toString());
                                                        }
                                                    };

                                                    matchesAcceptRequest aRequest = new matchesAcceptRequest("1",groupid3,chatport3,myid,userID3,listener);
                                                    RequestQueue queue2 = Volley.newRequestQueue(Accepted.this);
                                                    queue2.add(aRequest);
                                                    wait = 0;

                                                    RecievingRequest();
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

                                                    matchesDeclineRequest aRequest = new matchesDeclineRequest("0",myid,userID3,listener);
                                                    RequestQueue queue2 = Volley.newRequestQueue(Accepted.this);
                                                    queue2.add(aRequest);

//                                                    url = "http://143.215.84.147:"+new_port+"/acceptPhase/receiveMsgFromServer?userid="+myid;
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
            RequestQueue mQueue = Volley.newRequestQueue(Accepted.this);
            final JsonObjectRequest jsonRequest = new JsonObjectRequest(Request.Method
                    .GET, "http://143.215.84.147:3000/acceptPhase/receiveMsgFromServer?userid="+myid,
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
