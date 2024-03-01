const axios = require("axios");
const cheerio = require("cheerio");
const { SHOP_IMAGE_HOST_URL } = require("../../constants/urlConstants");

// Async function which scrapes the data
async function scrapeProductList(shop) {
  try {
    // Fetch HTML of the page we want to scrape
    const { data } = await axios.get(shop.url);
    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);
    // Select all the list items in plainlist class
    const listItems = $(".productgrid--item");

    // Stores data for all countries
    const products = [];
    // Use .each method to loop through the li we selected
    listItems.each((idx, el) => {
      const item = $(el);
      // Object holding data for each country/jurisdiction
      const product = { url: "", name: "", image: "", startPrice: "" };

      product.url = new URL(shop.url).origin + item.find("a").attr("href");
      product.name = item
        .find(".productitem--title a")
        .text()
        .replace(/\n/g, "")
        .trim();
      product.image =
        "https:" +
        item
          .find(".productitem--image")
          .find("img")
          .eq(1)
          .attr("src")
          .split("?")[0];
      product.startPrice = item.find(".money").text().trim();
      products.push(product);
    });
    return products;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Async function which scrapes the data
async function scrapeProductDetails() {
  try {
    let shop = {
      name: "Seven Seeds",
      img: SHOP_IMAGE_HOST_URL + "seven-seeds.jpg",
      url: "https://sevenseeds.com.au/collections/coffee",
      description:
        "This spot is ground zero for specialty coffee in Melbourne. Co-owner Mark Dundon created and sold the seminal Ray’s Cafe in Brunswick and St Ali in South Melbourne before founding “Seeds” with Bridget Amor in 2007. Nowadays they roast at a large facility in Fairfield, cooking beans for a small family of cafes including Brother Baba Budan and Traveller in the CBD. Dundon and Amor have been in the game for quite some time, and it shows. Alongside a solid bean roster (try the signature Golden Gate espresso blend), Seven Seeds also sells four-litre goon bags of ready-to-drink cold filter coffee, canned coffee and chai syrups, as well as bean-to-bar chocolate (through sister company Birdsnake).",
      products: [],
    };
    let products = [];

    const productList = await scrapeProductList(shop);

    for (const product of productList) {
      let singleProduct = { ...product };
      // Fetch HTML of the page we want to scrape
      const { data } = await axios.get(product.url);
      // Load HTML we fetched in the previous line
      const $ = cheerio.load(data, { xmlMode: true });
      const scriptTags = $("script:not([src])");
      const productDescription = $(".product-description.rte")
        .find(".p1")
        .text()
        .replace(/\r\n/g, "")
        .trim();
      let tagString;

      // check meta data exist. if exist save to tagString
      for (const tag of scriptTags) {
        if (tag?.children[0]?.data?.includes("var meta")) {
          let tagStrings = tag.children[0].data.split(";");
          tagStrings.forEach((string) => {
            if (string.includes("var meta")) {
              tagString = JSON.parse(string.split("=")[1]);
            }
          });
        }
      }

      if (
        tagString &&
        (tagString.product.type == "Coffee Beans" ||
          tagString.product.type == "Coffee")
      ) {
        let variants = [];
        for (const variant of tagString.product.variants) {
          let variantDetails = {
            name: variant.name.replace(
              "- " + variant.public_title.split("/")[0],
              ""
            ),
            weight: variant.public_title.split("/")[0].trim(),
            price: {
              currency: "aud",
              value: (variant.price / 100).toFixed(2),
            },
          };
          variants.push(variantDetails);
        }
        singleProduct.description = productDescription;
        singleProduct.variants = variants;
      }
      products.push(singleProduct);
    }
    shop.products = products;
    return shop;
  } catch (err) {
    console.error(err);
    return [];
  }
}

module.exports = scrapeProductDetails;
