const mongoose = require('mongoose');
const slugify = require('slugify');
const db = require('../../../app/db');
const Bootcamp = require('../../../models/Bootcamp');

describe('Bootcamp model', () => {
  beforeAll(async () => {
    await db();
  });

  afterAll(() => {
    mongoose.connection.close();
  });

  describe('pre hooks middleware', () => {
    let body;
    let bootcamp;

    beforeEach(async () => {
      body = {
        name: 'bootcamp name',
        description: 'description',
        address: 'address',
        careers: ['Web Development'],
        user: new mongoose.Types.ObjectId().toHexString(),
      };

      bootcamp = await Bootcamp.create(body);
    });

    afterEach(async () => {
      await Bootcamp.deleteMany();
    });

    it('should slugify the name to slug field on save', async () => {
      expect(bootcamp.slug).toBe(slugify(body.name, { lower: true }));
    });

    it('should geocode the address to location field on save', async () => {
      expect(bootcamp.address).not.toBeDefined();
      expect(bootcamp.location).toEqual(
        expect.objectContaining({
          type: 'Point',
          coordinates: expect.any(Array),
        })
      );
    });
  });
});
