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
    const listItems = $(".product-item");

    // Stores data for all countries
    const products = [];
    // Use .each method to loop through the li we selected
    listItems.each((idx, el) => {
      const item = $(el);
      // Object holding data for each country/jurisdiction
      const product = { url: "", name: "", image: "", startPrice: "" };

      product.url =
        new URL(shop.url).origin +
        item.find(".product-item-title a").attr("href");
      product.name = item.find(".quick-shop-title").text();
      product.image =
        "https:" +
        item
          // .find(".sqs-pinterest-image")
          .find("img")
          .eq(0)
          .attr("src")
          .split("?")[0];
      product.startPrice = item.find(".product-item-price .money").text();
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
      name: "Blume Coffee",
      img: SHOP_IMAGE_HOST_URL + "blume-coffee.jpg",
      url: "https://blumecoffee.com/collections/coffee",
      description:
        "This small, relatively new roastery belongs to Angus Gibbs. He’s a veteran of the industry, having spent time at well-respected coffee businesses, including Seven Seeds, Workshop and St Ali. It shows with his skilful approach to roasting, brewing and packaging. With Blume you get thoughtful, personal touches: hand-painted bags, handwritten labels, and quite a lot of love. Subscriptions are available and go out on the first Tuesday of each month.",
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
      const productDescription = $(".product-description.rte p").text();

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

      if (tagString) {
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
