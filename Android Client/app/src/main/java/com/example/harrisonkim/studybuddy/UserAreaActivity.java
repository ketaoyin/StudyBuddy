package com.example.harrisonkim.studybuddy;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;
import android.content.Intent;
import android.widget.Button;

public class UserAreaActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_user_area);

//        final EditText etUsername = (EditText) findViewById(R.id.etUsername);
        final EditText etYear = (EditText) findViewById(R.id.etYear);
//        final EditText etUserID = (EditText) findViewById(R.id.etUserID);
        final EditText etRating = (EditText) findViewById(R.id.etRating);
        final EditText etMajor = (EditText) findViewById(R.id.etMajor);
        final TextView welcomeMessage = (TextView) findViewById(R.id.tvWelcomeMsg);
        final Button bFindBuddy = (Button) findViewById(R.id.bFindBuddy);

        Intent intent = getIntent();
        String rating = intent.getStringExtra("rating");
        final String userID = intent.getStringExtra("userID");
        String name = intent.getStringExtra("name");
//        String username = intent.getStringExtra("username");
        String year = intent.getStringExtra("year");
        String major = intent.getStringExtra("major");

        System.out.println("RATING: " + rating);

        String message = name + " welcome to your user area";
        welcomeMessage.setText(message);
//        etUsername.setText(username);
        etRating.setText(rating);
        etYear.setText(year);
        etMajor.setText(major);
//        etUserID.setText(userID);
        bFindBuddy.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent registerIntent = new Intent(UserAreaActivity.this, findbuddy.class);
                registerIntent.putExtra("userID", userID);
                UserAreaActivity.this.startActivity(registerIntent);

            }
        });

    }
}
