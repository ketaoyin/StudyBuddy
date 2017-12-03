package com.example.harrisonkim.studybuddy;

/**
 * Created by harrisonkim on 10/23/17.
 */
import com.android.volley.toolbox.StringRequest;
import com.android.volley.Response;
import java.util.Map;
import java.util.HashMap;


// make a request and response as a string
public class RegisterRequest extends StringRequest{

    private static final String REGISTER_REQUEST_URL = "http://143.215.84.147:3000/users/createProfile";
    private Map<String, String> params;

    public RegisterRequest(String name, String username, String year, String major, String password, Response.Listener<String> listener){
        super(Method.POST, REGISTER_REQUEST_URL, listener, null);
        params = new HashMap<>();
        params.put("name", name);
        params.put("username", username);
        params.put("password", password);
        params.put("year", year);
        params.put("major", major);
    }

    @Override
    public Map<String, String> getParams() {
        return params;
    }
}
