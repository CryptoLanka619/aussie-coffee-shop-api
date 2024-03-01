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
    const listItems = $(".grid__item--collection-template");

    // Stores data for all countries
    const products = [];
    // Use .each method to loop through the li we selected
    listItems.each((idx, el) => {
      const item = $(el);
      // Object holding data for each country/jurisdiction
      const product = { url: "", name: "", image: "", startPrice: "" };

      product.url =
        new URL(shop.url).origin + item.find(".link-product").attr("href");
      product.name = item
        .find(".grid-view-item__title")
        .text()
        .replace(/\n/g, "")
        .trim();
      product.image =
        "https:" +
        item
          .find(".product-card__image")
          .find("img")
          .eq(0)
          .attr("src")
          .split("?")[0];
      product.startPrice = item.find(".price-item--regular").text().trim();
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
      name: "Wood and Co Coffee",
      img: SHOP_IMAGE_HOST_URL + "wood-and-co-coffee.jpg",
      url: "https://woodandcocoffee.com.au/collections/frontpage",
      description:
        "Brunswick-based Wood & Co is by Aaron Wood, who previously worked as a roaster at Seven Seeds and Atomic Coffee Roasters. His coffee is accessible, creatively packaged and incredibly well roasted. He also sells a range of great merch, including mugs, caps and T-shirts. Shipping is free on orders over $50.",
      products: [],
    };
    let products = [];

    const productList = await scrapeProductList(shop);

    const newProductList = productList.filter((product) => {
      if (!product.name.includes("Shirt")) return product;
    });

    for (const product of newProductList) {
      let singleProduct = { ...product };
      // Fetch HTML of the page we want to scrape
      const { data } = await axios.get(product.url);
      // Load HTML we fetched in the previous line
      const $ = cheerio.load(data, { xmlMode: true });
      const scriptTags = $("script:not([src])");
      const productDescription = "";
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
      if (tagString && tagString.product.variants.length > 1) {
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
    shop.products = products.filter((product) => {
      if ("variants" in product) return product;
    });
    return shop;
  } catch (err) {
    console.error(err);
    return [];
  }
}

module.exports = scrapeProductDetails;
