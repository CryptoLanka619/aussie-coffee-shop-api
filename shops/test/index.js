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

    const listItems = $(".a-section.review.aok-relative");

    // Stores data for all countries
    const products = [];
    // Use .each method to loop through the li we selected
    listItems.each((idx, el) => {
      const item = $(el);
      // Object holding data for each country/jurisdiction
      const product = { url: "", name: "", image: "", startPrice: "" };

      // product.url = new URL(shop.url).origin + item.find("a").attr("href");
      product.name = item.find(".a-profile-name").text();
      product.image = item
        .find(".a-profile-avatar")
        .find("img")
        .eq(0)
        .attr("src");
      product.startPrice = item
        .find("span.review-text")
        .text()
        .replace(/\n/g, "")
        .trim();
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
      name: "Assembly Store",
      img: SHOP_IMAGE_HOST_URL + "assembly-store.jpg",
      url: "https://www.amazon.com/Redragon-S101-Keyboard-Ergonomic-Programmable/product-reviews/B00NLZUM36",
      description:
        "Originally opened as a small space focusing solely on tea and filter coffee, Assembly in Carlton has since expanded to incorporate a neat espresso bar and an offsite roastery. If you’re looking to score brewing equipment alongside the beans, there are some good options here. And if you’re a tea enthusiast, look no further: Assembly imports outstanding teas from around the world, which are compelling enough to make coffee-lovers think about brewing something different next time.",
      products: [],
    };

    let products = [];

    const productList = await scrapeProductList(shop);

    console.log(productList);
    return;
    shop.products = products;
    return shop;
  } catch (err) {
    console.error(err);
  }
}

module.exports = scrapeProductDetails;
