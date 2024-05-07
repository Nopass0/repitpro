// import {
//   addStudent,
//   getStudentList,
//   getStudentWithItems,
//   getStudentsByDate,
//   updateStudentSchedule,
//   getGroupByStudentId,
//   updateStudentAndItems,
// } from "../cards/student";
// import db from "../db";

// describe("Student Functions", () => {
//   let testDataIds: { [key: string]: string[] } = {};

//   afterEach(async () => {
//     const deletedRecords = await db.$transaction([
//       db.studentSchedule.deleteMany(),
//       db.item.deleteMany(),
//       db.student.deleteMany(),
//       db.group.deleteMany(),
//       db.user.deleteMany(),
//       db.token.deleteMany(),
//     ]);
//     console.log("Deleted test data:", deletedRecords);
//   });

//   afterAll(async () => {
//     await db.$disconnect();
//   });

//   describe("addStudent", () => {
//     it("should add a new student and associated data", async () => {
//       // Create a user for testing
//       const user = await db.user.create({
//         data: {
//           name: "John Doe",
//           email: "john@example.com",
//           password: "password123",
//         },
//       });

//       // Create a token for the user
//       const token = await db.token.create({
//         data: {
//           userId: user.id,
//           token: "testtoken",
//         },
//       });

//       // Prepare test data for addStudent function
//       const data = {
//         nameStudent: "Jane Smith",
//         phoneNumber: "1234567890",
//         contactFace: "jane.smith",
//         email: "jane@example.com",
//         prePayCost: 100,
//         prePayDate: new Date(),
//         costOneLesson: 50,
//         commentStudent: "Test comment",
//         link: "https://example.com",
//         cost: 500,
//         items: [
//           {
//             itemName: "Item 1",
//             // ... other item data
//           },
//         ],
//         token: token.token,
//       };

//       // Call the addStudent function
//       await addStudent(data);

//       // Assert the expected behavior
//       const student = await db.student.findFirst({
//         where: { nameStudent: "Jane Smith" },
//         include: { group: true },
//       });

//       //   const _items = await db.item.findMany({
//       //     where: { groupId: student.groupId },
//       //   });

//       expect(student).toBeTruthy();
//       expect(student.nameStudent).toBe("Jane Smith");
//       //   expect(_items.length).toBeGreaterThan(0);
//     });
//   });

//   describe("getStudentList", () => {
//     it("should return a list of students", async () => {
//       // Create a user for testing
//       const user = await db.user.create({
//         data: {
//           name: "John Doe",
//           email: "john@example.com",
//           password: "password123",
//         },
//       });

//       // Create a token for the user
//       const token = await db.token.create({
//         data: {
//           userId: user.id,
//           token: "testtoken",
//         },
//       });

//       // Create some test students
//       //   await db.student.createMany({
//       //     data: [
//       //       {
//       //         nameStudent: "Jane Smith",
//       //         phoneNumber: "1234567890",
//       //         contactFace: "jane.smith",
//       //         email: "jane@example.com",
//       //         prePayCost: "100",
//       //         prePayDate: new Date(new Date().setFullYear(2024)), //random date in 2024
//       //         costOneLesson: "50",
//       //         commentStudent: "Test comment",
//       //         costStudent: "500",
//       //         userId: user.id,
//       //         groupId: "1",
//       //         address: "123 Main St",
//       //         linkStudent: "https://example.com",
//       //         storyLesson: "https://example.com",
//       //         targetLessonStudent: "https://example.com",
//       //         todayProgramStudent: "https://example.com",
//       //       },
//       //       {
//       //         nameStudent: "Bob Johnson",
//       //         phoneNumber: "1234567890",
//       //         contactFace: "bob.johnson",
//       //         email: "bob@example.com",
//       //         prePayCost: "100",
//       //         prePayDate: new Date(new Date().setFullYear(2024)), //random date in 2024
//       //         costOneLesson: "50",
//       //         commentStudent: "Test comment",
//       //         costStudent: "500",
//       //         userId: user.id,
//       //         groupId: "1",
//       //         address: "123 Main St",
//       //         linkStudent: "https://example.com",
//       //         storyLesson: "https://example.com",
//       //         targetLessonStudent: "https://example.com",
//       //         todayProgramStudent: "https://example.com",
//       //       },
//       //     ],
//       //   });

//       //addStudent
//       const student = addStudent({
//         nameStudent: "Jane Smith",
//         phoneNumber: "1234567890",
//         contactFace: "jane.smith",
//         email: "jane@example.com",
//         prePayCost: "100",
//         prePayDate: new Date(new Date().setFullYear(2024)), //random date in 2024
//         costOneLesson: "50",
//         commentStudent: "Test comment",
//         costStudent: "500",
//         userId: user.id,
//         valueMuiSelectArchive: 1,
//         address: "123 Main St",
//         linkStudent: "https://example.com",
//         storyLesson: "https://example.com",
//         targetLessonStudent: "https://example.com",
//         todayProgramStudent: "https://example.com",
//       });

//       // Call the getStudentList function
//       const students = await getStudentList(token.token);

//       // Assert the expected behavior
//       expect(students).toBeTruthy();
//       expect(students.length).toBeGreaterThan(0);
//       expect(
//         students.some((student) => student.nameStudent === "Jane Smith")
//       ).toBeTruthy();
//       expect(
//         students.some((student) => student.nameStudent === "Bob Johnson")
//       ).toBeTruthy();
//     });
//   });

//   // Add more test cases for other functions
// });
