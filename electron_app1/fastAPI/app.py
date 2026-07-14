# from transformers import AutoTokenizer, AutoModelForTokenClassification
# from fastapi import FastAPI
# app = FastAPI()
# app.listen(3002)



# MODEL_DIR = "./my_tinybert"  # path to the folder

# tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
# model = AutoModelForTokenClassification.from_pretrained(MODEL_DIR)


# # sentence will be passed in from the client

# @app.post("/extract")

# sentence = "Go to gym at 2pm"

# inputs = tokenizer(
#     sentence,
#     return_tensors="pt"
# )

# id2label = {
#   0: "O",
#   1: "B-EVENT",
#   2: "I-EVENT",
#   3: "B-TIME",
#   4: "I-TIME",
# }

# outputs = model(**inputs)

# predictions = outputs.logits.argmax(-1)

# tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])

# for token, pred in zip(tokens, predictions[0]):
#     print(token, id2label[pred.item()])

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Message(BaseModel):
    text: str


@app.get("/")
def root():
    return {"message": "Server is running!"}


@app.post("/echo")
def echo(message: Message):
    return {
        "received": message.text
    }