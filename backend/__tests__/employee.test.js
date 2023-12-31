const supertest = require('supertest');
const app = require('../app'); 
const mongoose = require('mongoose');
const Employee = require('../models/employee'); 
const Status = require('../utils/status');
const { appendToList, removeFromList, clean, getList, listLength } = require('../utils/moduleForTestingSupport');

const request = supertest(app);
let userToken, userId;

beforeAll(async () => {
    await mongoose.connect(`mongodb://${process.env.MONGO}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {
    if(!userToken){
        userToken = process.env.AUTH_TOKEN;
      }
    await clean(userToken);
    await mongoose.connection.close();
});

describe('Employee API endpoints', () => {
    // test('This test will always pass', () => {
    //     expect(true).toBeTruthy();
    // });
    let userpas = 'password1!D';
    let userem = 'testt@example.com';
    let userem2 = 'testtttttttt@example.com';
    userId = process.env.USER_ID;
    userToken = process.env.AUTH_TOKEN;
    let token, orgId, employeeId;
    let token2, id2;

    describe('Should always work', () =>{

        test('this test will always pass', () => {
          expect(true).toBe(true);
        });
        
    });

    describe('Proper Testing', () => {

        describe('Setup Functions', () => {
        
            describe('setting up users for testing', () => {

                it('should create a new user then log in', async () => {

                    const userResponse = await supertest(app)
                    .post('/api/users')
                    .send({
                        userName: 'testuser',
                        password: userpas,
                        userType: 'test',
                        firstName: 'Test',
                        lastName: 'User',
                        email: userem,
                        birthday: '1990-01-01',
                        bio: 'A test bio',
                        employments: [],
                        logs: ['anything can go here no matter how long it is and this is proof of this concept, literally anything even above the character max for the default']
                    });
                    if (userResponse.statusCode === 201){
                        appendToList(['users', userResponse.body.post._id]);
                        id = userResponse.body.post._id
                        expect(listLength()).toBeGreaterThan(0);
                    }
                    if (userResponse.message === "User already exists."){
                        const res2 = await supertest(app)
                            .get(`/api/users/email/${userem}`)
                            .set('Authorization', `Bearer ${userToken}`);
                        if(res2.status === 200){
                            appendToList(['users', res2.body.user._id]);
                            id = res2.body.user._id
                        }
                        expect(id).toBeDefined();
                        expect(res2.status).toEqual(200);
                    } else {

                        expect(userResponse.body.message).toEqual("User added successfully");
                        expect(userResponse.statusCode).toEqual(201);
                        expect(userResponse.body).toHaveProperty('post');
                    }
                    
                    const res = await request.post('/api/auth')
                    .send({
                        email: userem,
                        password: userpas
                        })
                    expect(res.statusCode).toEqual(200);
                    token = res.body.token;
                });
        
                it('should create a second new user and log in', async () => {
                    const userResponse2 = await supertest(app)
                    .post('/api/users')
                    .send({
                        userName: 'testuser',
                        password: userpas,
                        userType: 'test',
                        firstName: 'Test',
                        lastName: 'User',
                        email: userem2,
                        birthday: '1990-01-01',
                        bio: 'A test bio',
                        employments: [],
                    });
                    if (userResponse2.statusCode === 201){
            
                        appendToList(['users', userResponse2.body.post._id]);
                        id2 = userResponse2.body.post._id
                        expect(listLength()).toBeGreaterThan(0);
        
                    } else if (userResponse2.message === "User already exists."){
                        const res3 = await supertest(app)
                            .get(`/api/users/email/${userem2}`)
                            .set('Authorization', `Bearer ${userToken}`);
                        if(res3.status === 200){
                            appendToList(['users', res3.body.user._id]);
                            id2 = res3.body.user._id
                        }
                    }
                    expect(userResponse2.statusCode).toEqual(201);
                    expect(userResponse2.body).toHaveProperty('post');
                    
        
                    const res2 = await request.post('/api/auth')
                        .send({
                            email: userem2,
                            password: userpas
                        })
        
                    expect(res2.statusCode).toEqual(200);
                    token2 = res2.body.token;
        
                });

            });

            describe('creating a new org for testing', () => {

                it('should create a new organization', async () => {
                    const newOrg = { 
                        organizationName: "TestOrg",
                        organizationEmail: "testorg1@example.com",
                        organizationAdministrators: [id2],
                        employees: [userId],
                        industry: "Technology"
                    };
        
                    const response = await request.post('/api/org')
                        .set('Authorization', `Bearer ${userToken}`)
                        .send(newOrg);
        
                    if (response.status === 201) {
                        appendToList(['org', response.body.org._id]);
                    } 
                    if (response.message === "Organization already exists." || response.body.message === "Organization already exists."){
                            // appendToList(['org', response.body.org._id]);
                            const abcd = await request.get(`/api/org/email/${newOrg.organizationEmail}`)
                                .set('Authorization', `Bearer ${token}`);
                            orgId = abcd.response.org._id
                            expect(orgId).toBeDefined();
                            expect(orgId).not.toBeNull();
                            expect(orgId).not.toBe('');
                            appendToList(['org', orgId]);
                    } else {
                        expect(response.body.message).toEqual("Organization added successfully");
                        expect(response.status).toBe(201);
                        expect(response.body.org.organizationAdministrators).toContain(userId);
                        expect(response.body.org.organizationAdministrators).not.toEqual([userId]);
                        orgId = response.body.org._id;
                        expect(orgId).toBeTruthy();
                    }
                   
                });

            });
            describe('creating an employee for testing', () => {
                it('should create an employee', async () => {
                    const newEmployee = new Employee({
                        email : "testytesty@gmail.com",
                        userId : userId,
                        orgId : orgId,
                        status: Status.invited
                    });
                    await newEmployee.save()
                    employeeId = newEmployee.id
                    appendToList(['employee', employeeId])
                });
            });

        });

        describe('GET /api/employee/', () => {
            it('should get an array of employees', async () => {
                const response = await request.get(`/api/employee/`)
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('employees');
                expect(Array.isArray(response.body.employees)).toBeTruthy();
            });
        });

        describe('GET /api/employee/:id', () => {
            it('should get an employee by ID', async () => {
                const response = await request.get(`/api/employee/${employeeId}`)
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(200);
                expect(response.body.employee).toBeDefined();
            });

            it('should return not found for an invalid ID', async () => {
                const response = await request.get(`/api/employee/${userId}`)
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.body.message).toEqual("Employee not found");
                expect(response.status).toBe(404);
            });
        });

        describe('GET /api/employee/user/:userId', () => {
            it('should get employees by user ID', async () => {
                const response = await request.get(`/api/employee/byUserId/${userId}`)
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body.employees)).toBeTruthy();
            });

            it('should return no employees found for a non-existent user', async () => {
                const response = await request.get(`/api/employee/byUserId/${employeeId}`)
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.body.message).toEqual("No employees found");
                expect(response.status).toBe(404);

            });
        });

        describe('PUT /api/employee/:id', () => {
            it('should update an employee', async () => {
                const updatedData = { email: "newemail@example.com" };
                const response = await request.put(`/api/employee/${employeeId}`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(updatedData);

                expect(response.body.employee.email).toEqual(updatedData.email);
                expect(response.status).toBe(200);

            });

            it('should update an employee from org admin', async () => {
                const updatedData = { email: "newnewemail@example.com" };
                const response = await request.put(`/api/employee/${employeeId}`)
                    .set('Authorization', `Bearer ${token2}`)
                    .send(updatedData);

                expect(response.status).toBe(200);
                expect(response.body.employee.email).toEqual(updatedData.email);
            });

            it('should return invalid credentials when unauthorized', async () => {
                const updatedData = { email: "unauthorized@example.com" };
                const response = await request.put(`/api/employee/${employeeId}`)
                    .set('Authorization', `Bearer ${token}`)
                    .send(updatedData);

                expect(response.status).toBe(500);
                expect(response.body.message).toEqual("Invalid Credentials");
            });

            it('should return not found for an invalid ID', async () => {
                const updatedData = { email: "nonexistent@example.com" };
                const response = await request.put(`/api/employee/${userId}`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(updatedData);

                expect(response.status).toBe(500);
                expect(response.body.message).toEqual("Employee not found");
            });
        });

        describe('DELETE /api/employee/:id', () => {
            it('should return invalid credentials when unauthorized for delete', async () => {
                const response = await request.delete(`/api/employee/${employeeId}`)
                    .set('Authorization', `Bearer ${token}`);

                expect(response.body.message).toEqual("Invalid Credentials");
                expect(response.status).toBe(404);

            });

            it('should delete an employee', async () => {
                const response = await request.delete(`/api/employee/${employeeId}`)
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.body.message).toEqual("Employee deleted successfully");
                expect(response.status).toBe(200);
                removeFromList(['employees', employeeId]); // Assuming you manage a list of test records
            });

            it('should return not found for an invalid ID', async () => {
                const response = await request.delete(`/api/employee/${userId}`)
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.body.message).toEqual("Employee not found");
                expect(response.status).toBe(404);
            });
        });
    });
    
});