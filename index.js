import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "ThePostgreSql",
  port: 5432,
});
db.connect();

let retrievedArray = [];

db.query("SELECT country_code FROM public.visited_countries", (err, res) => {
  if (err) {
    console.error("Error executing query", err.stack);
  } else {
    retrievedArray = res.rows;
    //console.log(retrievedArray); // print out what you got back from the database
  }
  //db.end(); //not closing the db connection here because we want to keep it open for the rest of the app to use
});

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static("public"));

app.get("/", async (req, res) => {
  db.query("SELECT country_code FROM public.visited_countries", (err, dbres) => {
    if (err) {
      console.log("Query failed", err.stack);
    } else {
      retrievedArray = dbres.rows;
      console.log("Success:", retrievedArray);
          
      let totalCountries = retrievedArray.length;
      let countryCodes = (retrievedArray.map(item => item.country_code)); //convert this into a new array with the country codes 
      console.log(countryCodes); // print out the array of country codes
      console.log(typeof (countryCodes));
      res.render("index.ejs", { countries: countryCodes, total: totalCountries }); // pass the country codes and total count to the EJS template
   }
  });
  
});

app.post("/add", (req, res) => {
  const submittedCountry = req.body.country; //retrieved the submitted country name
  const cleanedCountry = submittedCountry.trim().toLowerCase(); // remove any leading/trailing whitespace and convert to lowercase for consistency
  const formattedCountry = cleanedCountry.charAt(0).toUpperCase() + cleanedCountry.slice(1); // capitalize the first letter of the country name to match the format in the database
  console.log("Formatted Country:", formattedCountry);
  db.query("SELECT country_code FROM public.countries WHERE country_name = $1", [formattedCountry], (err, dbres) => {
    if (err) {
      console.log("Query failed", err.stack);
    } else {
      const result = dbres.rows;
      console.log("Success:", result);

      db.query("INSERT INTO public.visited_countries (country_code) VALUES ($1)", [result[0].country_code], (err, dbres) => {
        console.log("Inserting country code:", result[0].country_code);
        if (err) {
          console.log("Query failed", err.stack);
        } else {
          console.log("Success:", dbres);
          res.redirect("/"); // redirect back to the home page after processing the form submission
        }
      });
    }
  }); // this is the callback function style of writing queries
});

//it can be written using the async/await style as well
/*
app.post("/add", async (req, res) => {
  const submittedCountry = req.body.name;

  try {
    // We REMOVE the (err, res) callback and just save the result to a variable
    const response = await db.query("SELECT country_code FROM countries WHERE country_name = $1", [submittedCountry]
    );

    const result = response.rows;
    console.log("Success:", result);
    
    // You can now safely use 'result' here for your next steps
    
  } catch (err) {
    // This replaces the 'if (err)' part of your callback
    console.error("Query failed", err.stack);
    res.status(500).send("Server Error");
  }
}); 
*/

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});