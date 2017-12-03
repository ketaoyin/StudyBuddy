package com.example.harrisonkim.studybuddy;

import com.android.volley.Response;
import com.android.volley.toolbox.StringRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by Christian on 11/28/2017.
 */

class leaveRequest extends StringRequest{
    private static final String LEAVING_RATING_REQUEST_URL = "http://143.215.84.147:3000/terminator/exitGroup";
    private Map<String, String> params;

    public leaveRequest(String myid, String groupid, Response.Listener<String> listener){
        super(Method.POST, LEAVING_RATING_REQUEST_URL, listener, null);
        params = new HashMap<>();
        params.put("userid", myid);
        params.put("groupid", groupid);
    }

    @Override
    public Map<String, String> getParams() {
        return params;
    }

}
