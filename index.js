import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

//the following code is used to create a database connection
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "enterpass",
  port: 5433,
});

db.connect();

const app = express();
const port = 4000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisited() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((a) => {
    countries.push(a.country_code);
  });

  return countries;
}

//run an async get request to get the country code from the visited countries and render the homepage

app.get("/", async (req, res) => {
  const countries = await checkVisited();
  console.log(countries);
  res.render("index.ejs", { countries: countries, total: countries.length });
});

//our aim here is to get the country from user and get the country code(using the user input)
//from the countries db and add it to the visited countries db for it to be rendered.
app.post("/add", async (req, res) => {
  //to add new country, we first extract the input from our ejs views
  const input = req.body["country"];
  //we now check the database to see if the input exists there and then get the country code
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      //then we redirect to the homepage
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisited();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisited();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
