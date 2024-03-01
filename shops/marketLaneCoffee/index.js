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
    const listItems = $(".product__item");

    // Stores data for all countries
    const products = [];
    // Use .each method to loop through the li we selected
    listItems.each((idx, el) => {
      const item = $(el);
      // Object holding data for each country/jurisdiction
      const product = { url: "", name: "", image: "", startPrice: "" };

      product.url =
        new URL(shop.url).origin + item.find(".product__top a").attr("href");
      product.name = item
        .find(".product__link.product__title")
        .text()
        .replace(/\r?\n|\r/g, "")
        .trim();
      product.image =
        "https:" +
        item
          .find(".product__top")
          .find("img")
          .eq(0)
          .attr("src")
          .split("?")[0]
          .replace("50x", "600x");
      product.startPrice = item
        .find(".product__price span")
        .text()
        .replace(/\r?\n|\r/g, "")
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
      name: "Market Lane Coffee",
      img: SHOP_IMAGE_HOST_URL + "market-lane-coffee.jpg",
      url: "https://marketlane.com.au/pages/coffee",
      description:
        "From a single cafe at Prahran Market established in 2009, Market Lane has bloomed to seven locations, plus a dedicated roastery in Brunswick East. In Melbourne it helped trailblaze the now-ubiquitous lighter style of coffee roasting, which better accentuates the character of each batch of beans. Sister company Melbourne Coffee Merchants is one of the finest green-bean importers in Australia and supplies quite a few of the other roasters on this list, with a focus on crops from Rwanda, Guatemala, Brazil and Colombia. Market Lane is where to go to when you want beautifully packaged, well-sourced, carefully roasted coffee that speaks of its origins. Subscriptions are $20 a fortnight, including shipping.",
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
      const productDescription = $(".product-detail__header.page__title")
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
