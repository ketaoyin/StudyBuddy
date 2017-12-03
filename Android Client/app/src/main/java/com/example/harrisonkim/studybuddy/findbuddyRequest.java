package com.example.harrisonkim.studybuddy;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.toolbox.StringRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by harrisonkim on 10/29/17.
 */

public class findbuddyRequest extends StringRequest{

    private static final String FINDBUDDY_REQUEST_URL = "http://143.215.84.147:3000/requests/userMatches";
    private Map<String, String> params;

    public findbuddyRequest(String userID, String classID, String distance, String latitude, String longitude, String group, Response.Listener<String> listener){
        super(Request.Method.POST, FINDBUDDY_REQUEST_URL, listener, null);
        params = new HashMap<>();
        params.put("userid", userID);
        params.put("classid", classID);
        params.put("radius", distance);
        params.put("lat", latitude);
        params.put("lng", longitude);
        params.put("searchType", group);
    }

    @Override
    public Map<String, String> getParams() {
        return params;
    }
}