/* ==========================================================
   GreenNest — sample data (products, experts, companions)
   ========================================================== */

const PRODUCTS = [
  { id:1,  name:"Snake Plant",          category:"Plants", env:["Indoor"], light:"low", price:450, stock:14, image:"https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=700&q=80", desc:"Near-indestructible, air-purifying, thrives on neglect." },
  { id:2,  name:"Money Plant (Pothos)", category:"Plants", env:["Indoor","Balcony"], light:"low", price:250, stock:22, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"Fast-growing trailing vine, great for shelves and hanging pots." },
  { id:3,  name:"Basil",                category:"Plants", env:["Outdoor","Balcony"], light:"high", price:120, stock:30, image:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=700&q=80", desc:"Fragrant kitchen herb, loves full sun and regular watering." },
  { id:4,  name:"Marigold",             category:"Plants", env:["Outdoor","Rooftop"], light:"high", price:90, stock:40, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"Bright, pest-repelling companion flower for vegetable beds." },
  { id:5,  name:"Tomato Sapling",       category:"Plants", env:["Outdoor","Rooftop"], light:"high", price:150, stock:18, image:"https://images.unsplash.com/photo-1592841200221-2d6b049fc4b2?auto=format&fit=crop&w=700&q=80", desc:"A rooftop favourite — pairs beautifully with basil and marigold." },
  { id:6,  name:"Areca Palm",           category:"Plants", env:["Indoor"], light:"med", price:850, stock:8, image:"https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=700&q=80", desc:"Statement indoor palm that thrives in bright, indirect light." },
  { id:7,  name:"Tomato Seeds (pack)",  category:"Seeds", env:["Outdoor","Rooftop"], light:"high", price:60, stock:50, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"Heirloom variety, 25 seeds per pack, high germination rate." },
  { id:8,  name:"Basil Seeds (pack)",   category:"Seeds", env:["Outdoor","Balcony"], light:"high", price:55, stock:45, image:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=700&q=80", desc:"Sweet basil seeds, ready to sow directly into soil." },
  { id:9,  name:"Marigold Seeds (pack)", category:"Seeds", env:["Outdoor","Rooftop"], light:"high", price:45, stock:60, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"Companion-planting classic, fast to sprout and flower." },
  { id:10, name:"Organic Compost 5kg", category:"Fertilizers", env:["Indoor","Outdoor","Rooftop","Balcony","Landscaping"], light:"any", price:280, stock:35, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"All-purpose organic compost for healthy root growth." },
  { id:11, name:"Liquid Bio-Fertilizer", category:"Fertilizers", env:["Indoor","Balcony"], light:"any", price:320, stock:20, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"Fast-absorbing liquid feed, ideal for potted plants." },
  { id:12, name:"NPK Granules 1kg", category:"Fertilizers", env:["Outdoor","Rooftop","Landscaping"], light:"any", price:210, stock:26, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"Balanced nutrient mix for vegetables and flowering plants." },
  { id:13, name:"Terracotta Pot (8in)", category:"Pots", env:["Indoor","Balcony"], light:"any", price:180, stock:40, image:"https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=700&q=80", desc:"Classic breathable terracotta, great drainage for most plants." },
  { id:14, name:"Ceramic Planter (Glazed)", category:"Pots", env:["Indoor"], light:"any", price:650, stock:12, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"Glossy finish planter with drainage hole and saucer." },
  { id:15, name:"Self-Watering Pot", category:"Pots", env:["Indoor","Balcony"], light:"any", price:790, stock:10, image:"https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=700&q=80", desc:"Built-in reservoir keeps soil moist for up to 2 weeks." },
  { id:16, name:"Hand Trowel Set", category:"Gardening tools", env:["Outdoor","Rooftop","Landscaping"], light:"any", price:340, stock:24, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"3-piece stainless steel set: trowel, fork, transplanter." },
  { id:17, name:"Pruning Shears", category:"Gardening tools", env:["Indoor","Outdoor","Rooftop","Balcony","Landscaping"], light:"any", price:410, stock:19, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"Sharp bypass blades for clean cuts, reduces plant stress." },
  { id:18, name:"Watering Can 2L", category:"Gardening tools", env:["Indoor","Balcony"], light:"any", price:290, stock:28, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"Narrow spout for precise watering of pots and seedlings." },
  { id:19, name:"Plant Support Stakes", category:"Accessories", env:["Outdoor","Rooftop"], light:"any", price:150, stock:33, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"Bamboo stakes to support climbing tomatoes and vines." },
  { id:20, name:"Moisture Meter", category:"Accessories", env:["Indoor","Balcony"], light:"any", price:380, stock:15, image:"https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80", desc:"Instantly reads soil moisture — no more guessing when to water." },
  { id:21, name:"Grow Light (LED)", category:"Accessories", env:["Indoor"], light:"low", price:1200, stock:9, image:"https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=700&q=80", desc:"Full-spectrum LED for low-light rooms and winter growth." },
];

const CATEGORIES = ["All","Plants","Seeds","Fertilizers","Pots","Gardening tools","Accessories"];
const ENVIRONMENTS = ["All","Indoor","Outdoor","Rooftop","Balcony","Landscaping"];

const EXPERTS = [
  { id:1, name:"Sabina Gurung",  specialty:"Rooftop Garden Installation", rating:4.9, price:"NPR 2,500 / visit", avatar:"🧑‍🌾", bio:"8 years designing rooftop and terrace gardens across Kathmandu." },
  { id:2, name:"Bikash Thapa",   specialty:"Landscaping",                 rating:4.7, price:"NPR 3,200 / visit", avatar:"👨‍🌾", bio:"Specializes in full-yard landscaping and irrigation layout." },
  { id:3, name:"Anisha Rai",     specialty:"Plant Consultation",          rating:5.0, price:"NPR 900 / session", avatar:"🧑‍🔬", bio:"Houseplant specialist — diagnoses light, water and pest issues." },
  { id:4, name:"Suman Lama",     specialty:"Disease Inspection",          rating:4.8, price:"NPR 1,100 / visit", avatar:"🧑‍⚕️", bio:"Identifies pests and disease early, prescribes organic treatment." },
  { id:5, name:"Puja Shrestha",  specialty:"Monthly Maintenance",         rating:4.6, price:"NPR 4,000 / month", avatar:"👩‍🌾", bio:"Ongoing pruning, feeding and health checks on a fixed schedule." },
  { id:6, name:"Rohit Karki",    specialty:"Home Visits",                 rating:4.9, price:"NPR 800 / visit",   avatar:"🧑‍🌾", bio:"General-purpose home gardening help, flexible scheduling." },
];

const DEFAULT_CUSTOMER_AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80";
const CUSTOMER_PROFILES = [
  { id:1, username:"customer1", name:"Aanya Sharma", email:"aanya@greennest.com", photo:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80" },
  { id:2, username:"customer2", name:"Meera Koirala", email:"meera@greennest.com", photo:"https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80" },
  { id:3, username:"customer3", name:"Sujan Bhandari", email:"sujan@greennest.com", photo:"" },
  { id:4, username:"customer4", name:"Priya Pandey", email:"priya@greennest.com", photo:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80" },
  { id:5, username:"customer5", name:"Abin Khadka", email:"abin@greennest.com", photo:"" }
];

function getCustomerProfiles(){
  const saved = readLS("greennest_customer_profiles", []);
  return saved.length ? saved : CUSTOMER_PROFILES.map((customer)=>({
    ...customer,
    photo: customer.photo || DEFAULT_CUSTOMER_AVATAR,
  }));
}

const COMPANIONS = [
  { set:["Tomato","Basil","Marigold"], note:"Basil repels pests near tomatoes; marigold protects roots from nematodes." },
  { set:["Cucumber","Beans","Radish"], note:"Beans fix nitrogen that cucumbers need; radish loosens soil for roots." },
  { set:["Carrot","Onion"],            note:"Onion scent confuses carrot fly, reducing pest damage." },
];

const INCOMPATIBLE = [
  { set:["Tomato","Cabbage"], note:"Compete heavily for the same nutrients and stunt each other's growth." },
  { set:["Basil","Rue"],      note:"Rue can inhibit basil's growth when planted too close." },
];

const SEASON_PLANTS = {
  Spring: ["Basil","Marigold","Tomato Sapling"],
  Summer: ["Snake Plant","Areca Palm","Money Plant (Pothos)"],
  Monsoon:["Money Plant (Pothos)","Snake Plant"],
  Autumn: ["Marigold","Tomato Sapling"],
  Winter: ["Areca Palm","Grow Light (LED)"]
};
