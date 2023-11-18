//テスト用関数。超絶適当
const pron = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "END"]
function randomMapping(pron: string[]) {
    let probTable = {}
    pron.forEach(p => {
        let probRow = {}
        pron.forEach(q => {
            let probCell = {}
            pron.forEach(r => {
                probCell[r] = Math.random()
            })
            probRow[q] = probCell
        })
        probTable[p] = probRow
    })
    return probTable
}

function randomWithWeight(table: object) {
    //重み合計を計算
    const totalWeight = Object.keys(table).reduce((a, b) => {
        return a + Number(table[b])
    }, 0)

    //合計の範囲内でランダムな数字
    const rawValue = Math.random() * totalWeight 

    //どの範囲に当てはまるかチェック
    let total = 0
    let value = ""
    for (const v in table) {
        total += Number(table[v])
        if (rawValue < total) {
            value = v
            break
        }
    }

    return value
}

function generateChain(prob: object, min: number, max: number, depth: number) {
    let word = ""
    while (word.length < min || word.length > max) {
        word = tryGenerate(prob, depth)
    }

    return word
}

function tryGenerate(prob: object, depth: number) {
    let chain = randomWithWeight(flatObj(prob["END"])) //n-gramに必要な数文字を生成
    if (chain.includes("END")) { //最初の数文字にENDが含まれると生成できなくなるのでやり直し。対処が必要
        return ""
    }
    while(true) {
        const lastCharas = chain.slice(-(depth - 1)).split("")
        const newChara = randomWithWeight(accessDeep(prob, lastCharas))
        
        if (newChara == "END") {
            break
        }
        chain += newChara
    }
    return chain
}

function calcProbTable(text: string, depth: number) { //確率をテキストから計算
    let probs = {}
    for (let i = 0; i <= text.length - depth; i++) {
        const ngramText = text.slice(i, i + depth).split("")

        accessDeep(probs, ngramText, 1)
    }
    return probs
}

function accessDeep(obj: object, path: string[], amount?: number) { //階層構造のオブジェクトに再帰でアクセス
    const nextLayer = path[0] == "\n"? "END": path[0]
    if (!obj.hasOwnProperty(nextLayer)) {
        if (path.length == 1) {
            obj[nextLayer] = 0
        } else {
            obj[nextLayer] = {}
        }
    }
    if (path.length == 1) {
        if (amount == undefined) {
            return obj[nextLayer]
        } else {
            obj[nextLayer] += amount
            return "none"
        }
    }
    return accessDeep(obj[nextLayer], path.slice(1), amount)
}

function flatObj(obj: object | number) { //オブジェクトの平坦化
    if (typeof obj == "number") { //末端階層で数値を返す
        return {"": obj}
    }

    const keys = Object.keys(obj)
    const merge = {}

    keys.forEach(v => {
        const underFlat: object = flatObj(obj[v])
        Object.keys(underFlat).forEach(p => {
            merge[v + p] = underFlat[p]
        })
    })

    return merge
}

//生成メイン

const depth = 3

const wordData: string = await Deno.readTextFile("./reference.txt"); //改行区切りで元となるテキストを用意
const EnglishTable = calcProbTable(wordData, depth)

await Deno.writeTextFile("./table.json", JSON.stringify(EnglishTable, null, 2));

//const map = randomMapping(pron)

let generateList: string[] = []
for (let i = 0; i < 300; i++) {
    generateList.push(generateChain(EnglishTable, 5, 10, depth))
}

const generateFile = generateList.join("\n")
await Deno.writeTextFile("./result.txt", generateFile);