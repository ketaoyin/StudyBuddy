package com.example.harrisonkim.studybuddy;

import com.android.volley.Response;
import com.android.volley.toolbox.StringRequest;

import java.util.HashMap;
import java.util.Map;
/**
 * Created by Christian on 11/12/2017.
 */

class matchesRequest extends StringRequest{
    private static final String MATCHES_REQUEST_URL = "http://143.215.84.147:3000/acceptPhase/invitePairReq";
    private Map<String, String> params;

    public matchesRequest(String myid, String userID, Response.Listener<String> listener){
        super(Method.POST, MATCHES_REQUEST_URL, listener, null);
        params = new HashMap<>();
        params.put("myid", myid);
        params.put("userid", userID);

    }

    @Override
    public Map<String, String> getParams() {
        return params;
    }
}


