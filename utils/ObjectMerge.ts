const data1 = {
  account: {
    "1": {
      name: "Alan Reis",
      age: 21
    },
    "3": {
      name: "Alberto Gonçalves",
      age: 41
    }
  }
}

const data2 = {
  account: {
    "1": {
      name: "Alan Reis Anjos",
      age: 21
    },
    "2": {
      name: "John Doe",
      age: 50
    }
  }
}

console.log({ ...data1, ...data2 })


