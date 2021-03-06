package com.example.harrisonkim.studybuddy;

import com.android.volley.Response;
import com.android.volley.toolbox.StringRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by Christian on 11/22/2017.
 */

class matchesAcceptRequest extends StringRequest {
    private static final String MATCH_ACCEPT_REQUEST_URL = "http://143.215.84.147:3000/acceptPhase/respondToPairReq";
    private Map<String, String> params;

    public matchesAcceptRequest(String s, String groupid2, String chatport2, String myid, String userID2,Response.Listener<String> listener) {
        super(Method.POST, MATCH_ACCEPT_REQUEST_URL, listener,null);
        params = new HashMap<>();
        params.put("value", s);
        params.put("newGroupID", groupid2);
        params.put("newChatPort", chatport2);
        params.put("myid", myid);
        params.put("userid",userID2);
    }
    @Override
    public Map<String, String> getParams() {
        return params;
    }

}
