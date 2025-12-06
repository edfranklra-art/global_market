// validation.js 
print("Aplicando validaciones a colecciones existentes...");

// 1. Validación  asegura gmail válido con regex
db.runCommand({
  collMod: "customers",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["customer_id", "customer_name", "email"],  
      properties: {
        customer_id: { bsonType: "string" },
        customer_name: { bsonType: "string" },
        gmail: { 
          bsonType: "string", 
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" 
        }
        
      }
    }
  }
});

// 2. Validación products, asegura precios positivos y rating válido
db.runCommand({
  collMod: "products",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["product_id", "product_name", "discounted_price"],  
      properties: {
        product_id: { bsonType: "string" },
        product_name: { bsonType: "string" },
        discounted_price: { bsonType: "double", minimum: 0 },  
        actual_price: { bsonType: "double", minimum: 0 },
        rating: { bsonType: "double", minimum: 0, maximum: 5 },  
        category: { bsonType: "string" },
        reviews: { 
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              user_id: { bsonType: "objectId" },
              rating: { bsonType: "int", minimum: 1, maximum: 5 },
              review_content: { bsonType: "string" }
            }
          }
        }
      }
    }
  }
});

// 3. Validación sales asegura amount positivo y data válida
db.runCommand({
  collMod: "sales",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["order_id", "product_id", "amount"],  
      properties: {
        order_id: { bsonType: "string" },
        product_id: { bsonType: "string" },
        amount: { bsonType: "double", minimum: 0 },  
        date: { bsonType: "date" },  
        ship_city: { bsonType: "string" },
        quantity: { bsonType: "int", minimum: 1 }  
      }
    }
  }
});

// 4. Validación para la colección reviews asegura rating válido
db.runCommand({
  collMod: "reviews",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["review_id", "product_id", "user_id", "rating"],  
      properties: {
        review_id: { bsonType: "string" },
        product_id: { bsonType: "string" },
        user_id: { bsonType: "objectId" },
        rating: { bsonType: "int", minimum: 1, maximum: 5 }, 
        review_content: { bsonType: "string" }
      }
    }
  }
});

// 5. Validación products_raw datos crudos; validación mínima
db.runCommand({
  collMod: "products_raw",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["product_id"],  
      properties: {
        product_id: { bsonType: "string" }
        
      }
    }
  }
});

print("las Validaciones fueron  aplicadas .");