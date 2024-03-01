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
    const listItems = $(".product-list-item");

    // Stores data for all countries
    const products = [];
    // Use .each method to loop through the li we selected
    listItems.each((idx, el) => {
      const item = $(el);
      // Object holding data for each country/jurisdiction
      const product = { url: "", name: "", image: "", startPrice: "" };

      product.url =
        new URL(shop.url).origin +
        item.find(".product-list-item-title a").attr("href");
      product.name = item.find(".product-list-item-title").text();
      product.image =
        "https:" +
        item
          // .find(".sqs-pinterest-image")
          .find("img")
          .eq(0)
          .attr("src")
          .split("?")[0];
      product.startPrice = item.find(".money").text();
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
      name: "Everyday Coffee",
      img: SHOP_IMAGE_HOST_URL + "everyday-coffee.jpg",
      url: "https://everyday-coffee.com/collections/coffee",
      description:
        "Since opening Everyday Coffee on Johnston Street, Collingwood in 2012, the company has become a Melbourne institution, with a second location in the CBD. In addition to seasonal filter roasts, the online store sells two espresso blends. All Day is the balanced blend served as standard at Everyday’s cafes, while Mucho Gusto is a bolder, darker roast that pays homage to Italian coffee. Everyday Express, the company’s subscription service, is notably flexible. You can choose to pay upfront or ongoing, opt for whole or ground beans, and specify what quantity of coffee you’d like to receive each month.",
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
        .text()
        .replace(/\n/g, "")
        .trim()
        .replace("To learn more about our shipping policy click here.", "")
        .replace(
          "***Please note, due to COVID-19, AusPost is experiencing some delays. We will still send your order ASAP but please allow extra time for the postie to get it to you.",
          ""
        );

      // console.log(productDescription);
      // return;

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

      if (tagString && tagString.product.type == "Retail Coffee") {
        let variants = [];
        for (const variant of tagString.product.variants) {
          let variantDetails = {
            name: variant.name.replace(
              "- " + variant.public_title.split("/")[0],
              ""
            ),
            weight: variant.public_title.split("/")[0],
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
