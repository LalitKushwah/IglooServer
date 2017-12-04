import request from "supertest"
import GraphQLServer from "../app.js"
import {generateAuthenticationToken} from "../graphql/resolvers/utilities"

require("dotenv").config()
if (!process.env.JWT_SECRET) {
    throw new Error("Could not load .env")
}

const {JWT_SECRET} = process.env
let self = {}

describe("User", function() {
    beforeAll(() => {
        // creating an account to perform all the operations
        return request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .send({
                query: `mutation SignupUser($email: String!, $password: String!) {
                                SignupUser(email: $email, password: $password) {
                                    id
                                    token
                                }
                            }
                        `,
                variables: {
                    email: "userTest@email.com",
                    password: "password",
                },
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.data.SignupUser.id).toBeTruthy()
                expect(parsedRes.data.SignupUser.token).toBeTruthy()
                expect(parsedRes.errors).toBeUndefined()
                self.userId = parsedRes.data.SignupUser.id
                self.token = parsedRes.data.SignupUser.token
            })
    })
    it("should load all props", done => {
        request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .set("Authorization", "Bearer " + self.token)
            .send({
                query: `query User{
                            user{
                                id
                                email
                                updatedAt
                                createdAt
                                devices{
                                    id
                                }
                                values{
                                    id
                                }
                            }
                        }
                    `,
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.data.user.id).toBe(self.userId)
                expect(parsedRes.data.user.email).toBe("userTest@email.com")
                expect(parsedRes.data.user.createdAt).toBeTruthy()
                expect(parsedRes.data.user.updatedAt).toBeTruthy()
                expect(parsedRes.data.user.devices).toEqual([])
                expect(parsedRes.data.user.values).toEqual([])
                expect(parsedRes.errors).toBeUndefined()
                done()
            })
    })

    it("should not work without a token", done => {
        request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            .send({
                query: `query User{
                            user{
                                id
                                email
                                updatedAt
                                createdAt
                                devices{
                                    id
                                }
                                values{
                                    id
                                }
                            }
                        }
                    `,
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.errors).toBeTruthy()
                expect(parsedRes.errors[0].message).toBe(
                    "You are not authenticated. Use `AuthenticateUser` to obtain an authentication token"
                )
                done()
            })
    })

    it("should not work if the user doesn't exist anymore", done => {
        request(GraphQLServer)
            .post("/graphql")
            .set("content-type", "application/json")
            .set("accept", "application/json")
            // Creating a token referring to a wrong id
            // to emulate a user that doesn't exist anymore
            .set(
                "Authorization",
                "Bearer " +
                    generateAuthenticationToken(
                        "aaf5480f-b804-424d-bec8-3f7b363b5519",
                        JWT_SECRET
                    )
            )
            .send({
                query: `query User{
                            user{
                                id
                                email
                                updatedAt
                                createdAt
                                devices{
                                    id
                                }
                                values{
                                    id
                                }
                            }
                        }
                    `,
            })
            .then(res => {
                const parsedRes = JSON.parse(res.text)
                expect(parsedRes.errors).toBeTruthy()
                expect(parsedRes.errors[0].message).toBe(
                    "User doesn't exist. Use `SignupUser` to create one"
                )
                done()
            })
    })
})