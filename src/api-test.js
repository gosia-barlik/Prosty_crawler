console.log("Start API testu...");

//musimy znać url
const URL =
  "https://massachusetts.pracuj.pl/recommendedJobOffers/listing/grouped" +
  "?languageCode=pl" +
  "&offset=0" +
  "&limit=23" +
  "&source=pracujpl" +
  "&context=oferta_bottom" +
  "&offerIds=1004586289" +
  "&identityId=14134609-103f-4f5d-a8b0-de09fbd0aae0";

async function getOffers() {
  const response = await fetch(URL, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0"
    }
  });

  console.log("Status HTTP:", response.status);

  if (!response.ok) {
    console.error("Błąd HTTP:", response.status);
    return;
  }

  const data = await response.json();

  console.log("Klucze response:", Object.keys(data));
  console.log("Liczba ofert:", data.groupedOffers?.length);
  console.log("Pierwsza oferta:", data.groupedOffers?.[0]);
}

getOffers().catch(console.error);
