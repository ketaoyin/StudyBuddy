package com.example.harrisonkim.studybuddy;

import com.android.volley.Response;
import com.android.volley.toolbox.StringRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by Christian on 11/28/2017.
 */

class ratingRequest extends StringRequest{

    private static final String RATING_REQUEST_URL = "http://143.215.84.147:3000/terminator/rateMember";
    private Map<String, String> params;

    public ratingRequest(String myid, String userID2, String rating, Response.Listener<String> listener){
        super(Method.POST, RATING_REQUEST_URL, listener, null);
        params = new HashMap<>();
        params.put("myid", myid);
        params.put("userid", userID2);
        params.put("rating",rating);
    }

    @Override
    public Map<String, String> getParams() {
        return params;
    }

}
