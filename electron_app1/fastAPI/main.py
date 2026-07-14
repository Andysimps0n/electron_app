from pathlib import Path

from transformers import AutoTokenizer, AutoModelForTokenClassification
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
class Message(BaseModel):
    text: str


@app.get("/")
def root():
    return {"message": "Server is running!"}


@app.post("/extract")
def echo(message: Message):

    extracted = extract(message.text)
    return extracted
    



    


# Resolve the model folder relative to THIS file, not the shell's current
# working directory. "./my_tinybert" only works if you happen to run uvicorn
# from inside fastAPI/; on Render (or from the repo root) it would fail.
MODEL_DIR = str(Path(__file__).parent / "my_tinybert")
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForTokenClassification.from_pretrained(MODEL_DIR)

def extract(sentence):
    inputs = tokenizer(
        sentence,
        return_tensors="pt"
    )
    id2label = {
    0: "O",
    1: "B-EVENT",
    2: "I-EVENT",
    3: "B-TIME",
    4: "I-TIME",
    }
    label2id = {
    "O": 0,
    "B-EVENT": 1,
    "I-EVENT": 2,
    "B-TIME": 3,
    "I-TIME": 4,
    }

    outputs = model(**inputs)
    finial_object = []

    predictions = outputs.logits.argmax(-1)
    tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
    tokens.pop()
    predictions = predictions[0].tolist()
    predictions.pop()

    time = ""
    event = ""
    for token, pred in zip(tokens, predictions):
        print(token, id2label[pred])

    # WordPiece: "##ing" continues the previous word; otherwise start a new word.
    def append_piece(current, token):
        if token in ("[CLS]", "[SEP]", "[PAD]"):
            return current
        if token.startswith("##"):
            return current + token[2:]
        if not current:
            return token
        return current + " " + token

    for token, pred in zip(tokens, predictions):
        label = id2label[pred]
        if label in ("B-TIME", "I-TIME"):
            time = append_piece(time, token)
        elif label in ("B-EVENT", "I-EVENT"):
            event = append_piece(event, token)

    result = {
        "extracted": {
            "event": event,
            "time": time,
        }
    }

    #  result.extracted.event 
    return result

# Schedule shopping for clothes for 2pm"
