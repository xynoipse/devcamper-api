const supertest = require('supertest');
const mongoose = require('mongoose');
const Bootcamp = require('../../../models/Bootcamp');
const app = require('../../../app');
const request = supertest(app);

describe('/api/bootcamps', () => {
  afterAll(() => {
    mongoose.connection.close();
  });

  afterEach(async () => {
    await Bootcamp.deleteMany();
  });

  describe('GET /', () => {
    let query;

    const exec = () => {
      return request.get('/api/bootcamps').query(query);
    };

    beforeEach(async () => {
      await Bootcamp.insertMany([
        {
          name: 'bootcamp1',
          description: 'description',
          address: 'address',
          jobGuarantee: true,
          careers: ['Web Development'],
        },
        {
          name: 'bootcamp2',
          description: 'description',
          address: 'address',
          jobGuarantee: false,
          careers: ['Mobile Development'],
        },
      ]);
    });

    it('should return all bootcamps', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.some((b) => b.name === 'bootcamp1')).toBeTruthy();
      expect(res.body.data.some((b) => b.name === 'bootcamp2')).toBeTruthy();
    });

    it('should return filtered bootcamps if fields in query string is set', async () => {
      jobGuarantee = true;
      careers = ['Web Development'];

      query = { jobGuarantee, 'careers[in]': careers };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ jobGuarantee }),
          expect.objectContaining({
            careers: expect.arrayContaining(careers),
          }),
        ])
      );
    });

    it('should return all bootcamps to only have the selected fields', async () => {
      query = { select: 'name,description' };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            description: expect.any(String),
          }),
          expect.not.objectContaining({
            address: expect.any(String),
          }),
        ])
      );
    });

    it('should return sorted bootcamps if query string sort parameter is set', async () => {
      query = { sort: 'name' };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data[0].name).toBe('bootcamp1');
      expect(res.body.data[1].name).toBe('bootcamp2');
    });

    it('should return paginated bootcamps if query string limit parameter is set', async () => {
      query = { limit: 1 };

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.pagination).toMatchObject({
        next: { page: 2, limit: 1 },
      });
      expect(res.body.data).toBeDefined();
    });

    it('should return page paginated bootcamps if query string page parameter is set', async () => {
      query = { limit: 1, page: 2 };

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.pagination).toMatchObject({
        prev: { page: 1, limit: 1 },
      });
      expect(res.body.data).toBeDefined();
    });
  });

  describe('POST /', () => {
    let body;

    const exec = () => {
      return request.post('/api/bootcamps').send(body);
    };

    beforeEach(() => {
      body = {
        name: 'bootcamp1',
        description: 'description',
        address: 'address',
        careers: ['Web Development'],
      };
    });

    it('should return 400 if there is a duplicate key error', async () => {
      await Bootcamp.insertMany([body]);

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.name).toBeDefined();
    });

    it('should return 400 if there is a validation error', async () => {
      delete body.name;

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.name).toBeDefined();
    });

    it('should save the bootcamp if it is valid', async () => {
      await exec();

      const bootcamp = await Bootcamp.findOne({ name: body.name });

      expect(bootcamp).not.toBeNull();
    });

    it('should return the created bootcamp if it is valid', async () => {
      const res = await exec();

      const bootcamp = await Bootcamp.findOne({ name: body.name });

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('name', bootcamp.name);
    });

    it('should geocode the address to location field if it is valid', async () => {
      await exec();

      const bootcamp = await Bootcamp.findOne({ name: body.name });

      expect(bootcamp.address).not.toBeDefined();
      expect(bootcamp.location).toEqual(
        expect.objectContaining({
          type: 'Point',
          coordinates: expect.any(Array),
        })
      );
    });
  });

  describe('GET /:id', () => {
    let id;
    let bootcamp;

    const exec = () => {
      return request.get(`/api/bootcamps/${id}`);
    };

    beforeEach(async () => {
      bootcamp = await Bootcamp.create({
        name: 'bootcamp1',
        description: 'description',
        address: 'address',
        careers: ['Web Development'],
      });

      id = bootcamp._id;
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if bootcamp with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return a bootcamp if id is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', bootcamp.name);
    });
  });

  describe('PUT /:id', () => {
    let id;
    let name;

    const exec = () => {
      return request.put(`/api/bootcamps/${id}`).send({ name });
    };

    beforeEach(async () => {
      await Bootcamp.insertMany([
        {
          name: 'bootcamp1',
          description: 'description',
          address: 'address',
          careers: ['Web Development'],
        },
        {
          name: 'bootcamp2',
          description: 'description',
          address: 'address',
          careers: ['Mobile Development'],
        },
      ]);

      const bootcamp = await Bootcamp.findOne();

      id = bootcamp._id;
      name = 'newName';
    });

    it('should return 400 if there is a duplicate key error', async () => {
      name = 'bootcamp2';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.name).toBeDefined();
    });

    it('should return 400 if there is a validation error', async () => {
      name = '';

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
      expect(res.body.errors.name).toBeDefined();
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if bootcamp with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should update the bootcamp if it is valid', async () => {
      await exec();

      const bootcamp = await Bootcamp.findById(id);

      expect(bootcamp).not.toBeNull();
      expect(bootcamp.name).toBe(name);
    });

    it('should return the updated bootcamp if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', name);
    });
  });

  describe('DELETE /:id', () => {
    let id;

    const exec = () => {
      return request.delete(`/api/bootcamps/${id}`);
    };

    beforeEach(async () => {
      const bootcamp = await Bootcamp.create({
        name: 'bootcamp1',
        description: 'description',
        address: 'address',
        careers: ['Web Development'],
      });

      id = bootcamp._id;
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should return 404 if bootcamp with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it('should delete the bootcamp if it is valid', async () => {
      await exec();

      const deletedBootcamp = await Bootcamp.findById(id);

      expect(deletedBootcamp).toBeNull();
    });

    it('should return 200 if it is valid', async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
