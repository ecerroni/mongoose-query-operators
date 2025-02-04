import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import mapMongoOperators from '../src'
import { docs, docsMultiSort, operators } from './fixtures'

jest.setTimeout(60000)

let mongoServer
let Test, TestMultiSort

beforeAll(async () => {
  mongoServer = new MongoMemoryServer({
    binary: {
      version: '4.0.3',
      downloadDir: './__tests__/mongo-bin'
    }
  })
  const mongoUri = await mongoServer.getConnectionString()
  await mongoose.connect(mongoUri, {}, err => {
    if (err) console.error(err)
  })
  Test = await mongoose.model(
    'Test',
    new mongoose.Schema({
      name: String,
      age: Number,
      field: Number,
      description: {
        type: String,
        index: 'text'
      }
    })
  )
  await Test.insertMany([...docs])
  TestMultiSort = await mongoose.model(
    'TestMultiSort',
    new mongoose.Schema({
      name: String,
      age: Number,
      field: Number,
      description: {
        type: String,
        index: 'text'
      }
    })
  )
  await TestMultiSort.insertMany([...docsMultiSort])
})

beforeEach(async () => {})

afterEach(async () => {})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

test('It should have mongo started', async () => {
  expect(mongoose.connection.readyState).toBe(1)
})

test('It should be able to query', async () => {
  const result = await Test.find({}).lean()
  expect(result).toHaveLength(docs.length)
})

test('It should apply containss modifier', async () => {
  const result = await mapMongoOperators(Test, { ...operators.containss })
  expect(result).toHaveLength(1)
  expect(result[0].name).toBe('Lore')
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply contains modifier', async () => {
  const result = await mapMongoOperators(Test, { ...operators.contains })
  expect(result).toHaveLength(2)
  expect(result[0].name).toBe('lore')
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply containsIndex modifier', async () => {
  const result = await mapMongoOperators(Test, { ...operators.containsIndex })
  expect(result).toHaveLength(1)
  expect(result[0].description).toEqual(
    expect.stringContaining(docs[1].description)
  )
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply containssIndex modifier', async () => {
  const result = await mapMongoOperators(Test, { ...operators.containssIndex })
  expect(result).toHaveLength(1)
  expect(result[0].description).toEqual(
    expect.stringMatching(docs[0].description)
  )
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply matchesIndex modifier', async () => {
  const result = await mapMongoOperators(Test, { ...operators.matchesIndex })
  expect(result).toHaveLength(3)
  expect(result[0].description).toEqual(
    expect.stringContaining(docs[0].description)
  )
  expect(result[1].description).toEqual(
    expect.stringContaining(docs[2].description)
  )
  expect(result[2].description).toEqual(
    expect.stringContaining(docs[1].description)
  )
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply matchessIndex modifier', async () => {
  const result = await mapMongoOperators(Test, { ...operators.matchessIndex })
  expect(result).toHaveLength(1)
  expect(result[0].description).toEqual(
    expect.stringContaining(docs[1].description)
  )
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply matches modifier', async () => {
  const result = await mapMongoOperators(Test, { ...operators.matches })
  expect(result).toHaveLength(3)
  expect(result[0].name).toBe('lore')
  expect(result[1].name).toBe('ipsum')
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply matchess modifier', async () => {
  const result = await mapMongoOperators(Test, { ...operators.matchess })
  expect(result).toHaveLength(2)
  expect(result[0].name).toBe('ipsum')
  expect(result[1].name).toBe('Lore')
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply gt modifier', async () => {
  const result = await mapMongoOperators(Test, { ...operators.gt })
  expect(result).toHaveLength(1)
  expect(result[0].age).toBe(6)
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply gte modifier', async () => {
  const result = await mapMongoOperators(TestMultiSort, { ...operators.gte })
  expect(result).toHaveLength(3)
  expect(result[0].age).toBe(5)
  expect(result[1].age).toBe(6)
  expect(result[1].age).toBe(6)
})

test('It should apply where on field with no modifiers', async () => {
  const result = await mapMongoOperators(Test, { ...operators.field })
  expect(result).toHaveLength(1)
  expect(result[0].field).toBe(3)
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply limit operator', async () => {
  const result = await mapMongoOperators(Test, { limit: 2 })
  expect(result).toHaveLength(2)
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply sort ASC and limit operator', async () => {
  const result = await mapMongoOperators(Test, { limit: 2, sort: 'field:asc' })
  expect(result).toHaveLength(2)
  expect(result[0].field).toBe(1)
  expect(result[1].field).toBe(2)
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply sort ASC and limit + skip operator', async () => {
  const result = await mapMongoOperators(Test, {
    limit: 2,
    skip: 1,
    sort: 'field:asc'
  })
  expect(result).toHaveLength(2)
  expect(result[0].field).toBe(2)
  expect(result[1].field).toBe(3)
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply sort DESC ', async () => {
  const result = await mapMongoOperators(Test, { sort: 'field:desc' })
  expect(result).toHaveLength(docs.length)
  expect(result[0].field).toBe(3)
  expect(result[1].field).toBe(2)
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply sort DESC and limit operator', async () => {
  const result = await mapMongoOperators(Test, { limit: 2, sort: 'field:desc' })
  expect(result).toHaveLength(2)
  expect(result[0].field).toBe(3)
  expect(result[1].field).toBe(2)
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply sort ASC with array of values and limit operator', async () => {
  const result = await mapMongoOperators(TestMultiSort, {
    limit: 2,
    sort: ['field:asc', 'age:desc']
  })
  expect(result).toHaveLength(2)
  expect(result[0].field).toBe(1)
  expect(result[1].field).toBe(1)
  expect(result[0].age).toBe(6)
  expect(result[1].age).toBe(5)
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply sort DESC with array of values and limit operator', async () => {
  const result = await mapMongoOperators(TestMultiSort, {
    limit: 2,
    sort: ['field:desc', 'age:asc']
  })
  expect(result).toHaveLength(2)
  expect(result[0].field).toBe(2)
  expect(result[1].field).toBe(1)
  expect(result[0].age).toBe(6)
  expect(result[1].age).toBe(4)
  expect(result[0].constructor.name).toBe('model')
})

test('It should apply sort DESC and limit operator with lean', async () => {
  const result = await mapMongoOperators(Test, {
    limit: 2,
    sort: 'field:desc'
  }).lean()
  expect(result).toHaveLength(2)
  expect(result[0].field).toBe(3)
  expect(result[1].field).toBe(2)
  expect(result[0].constructor.name).toBe('Object')
})

test('It should apply more than one modifier in where', async () => {
  const result = await mapMongoOperators(Test, {
    ...operators.contains_gte
  })
  expect(result).toHaveLength(2)
  expect(result[0].age).toBe(4)
  expect(result[1].age).toBe(6)
  expect(result[0].constructor.name).toBe('model')
})
test('It should return just one field per row with select', async () => {
  const result = await mapMongoOperators(Test, {
    ...operators.contains_gte
  }).select('age')
  expect(result).toHaveLength(2)
  expect(result[0].age).toBe(4)
  expect(result[1].age).toBe(6)
  expect(result[0].field).toBe(undefined)
  expect(result[0].name).toBe(undefined)
  expect(result[0].constructor.name).toBe('model')
})

test('It should return just one field per row with { age: 1 }', async () => {
  const result = await mapMongoOperators(
    Test,
    {
      ...operators.contains_gte
    },
    { age: 1 }
  )
  expect(result).toHaveLength(2)
  expect(result[0].age).toBe(4)
  expect(result[1].age).toBe(6)
  expect(result[0].field).toBe(undefined)
  expect(result[0].name).toBe(undefined)
  expect(result[0].constructor.name).toBe('model')
})

test('It should return what is included in where condition', async () => {
  const result = await mapMongoOperators(Test, {
    ...operators.age_in
  })
  expect(result).toHaveLength(2)
  expect(result[0].age).toBe(4)
  expect(result[1].age).toBe(5)
})

test('It should return what is NOT included in where condition', async () => {
  const result = await mapMongoOperators(Test, {
    ...operators.age_nin
  })
  expect(result).toHaveLength(1)
  expect(result[0].age).toBe(6)
})

test('It should return what is included in where condition even if single value', async () => {
  const result = await mapMongoOperators(Test, {
    ...operators.age_in_single
  })
  expect(result).toHaveLength(1)
  expect(result[0].age).toBe(4)
})

test('It should apply params outside of where', async () => {
  const result = await mapMongoOperators(Test, {
    ...operators.standard
  })
  expect(result).toHaveLength(1)
  expect(result[0].field).toBe(1)
})

test('It should apply both params outside of where and where', async () => {
  const result = await mapMongoOperators(Test, {
    ...operators.mixed
  })
  expect(result).toHaveLength(1)
  expect(result[0].field).toBe(3)
})

test('It should apply both params outside of where and where giving where priority', async () => {
  const result = await mapMongoOperators(Test, {
    ...operators.mixedPrecedence
  })
  expect(result).toHaveLength(1)
  expect(result[0].field).toBe(3)
})

test('It should apply native conditional operators', async () => {
  const result = await mapMongoOperators(Test, {
    ...operators.conditional
  })
  expect(result).toHaveLength(2)
  expect(result[0].field).toBe(1)
  expect(result[1].field).toBe(3)
})
