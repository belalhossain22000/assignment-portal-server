import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { IUser, IUserFilterRequest } from "./user.interface";
import * as bcrypt from "bcrypt";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { Prisma, User } from "@prisma/client";
import { userSearchAbleFields } from "./user.costant";
import config from "../../../config";
import httpStatus from "http-status";

// Create a new user in the database.
const createUserIntoDb = async (payload: User) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    if (existingUser.email === payload.email) {
      throw new ApiError(
        400,
        `User with this email ${payload.email} already exists`
      );
    }
  }
  const hashedPassword: string = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds)
  );

  const result = await prisma.user.create({
    data: { ...payload, password: hashedPassword },
  });

  return result;
};

// reterive all users from the database also searcing anf filetering
const getUsersFromDb = async (
  params: IUserFilterRequest,
  options: IPaginationOptions
) => {
  try {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.UserWhereInput[] = [];

    // Search functionality
    if (searchTerm?.trim()) {
      andConditions.push({
        OR: userSearchAbleFields.map((field) => ({
          [field]: {
            contains: searchTerm.trim(),
            mode: "insensitive",
          },
        })),
      });
    }

    // Filter functionality - improved to handle different data types
    if (Object.keys(filterData).length > 0) {
      const filterConditions = Object.entries(filterData)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => {
          // Handle boolean fields
          if (typeof value === 'boolean') {
            return { [key]: value };
          }
          
          // Handle string fields with exact match
          if (typeof value === 'string') {
            return { [key]: { equals: value } };
          }
          
          // Handle other types
          return { [key]: { equals: value } };
        });

      if (filterConditions.length > 0) {
        andConditions.push({ AND: filterConditions });
      }
    }

    const whereConditions: Prisma.UserWhereInput = 
      andConditions.length > 0 ? { AND: andConditions } : {};

    // Execute queries in parallel for better performance
    const [result, total] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
        include: {
          // Include all related tables from your schema
          instructorAssignments: {
            include: {
              submissions: true,
              notifications: true,
            },
          },
          submissions: {
            include: {
              assignment: true,
              notifications: true,
            },
          },
          notifications: {
            include: {
              assignment: true,
              submission: true,
            },
          },
        },
        orderBy:
          options.sortBy && options.sortOrder
            ? { [options.sortBy]: options.sortOrder }
            : { createdAt: "desc" },
      }),
      prisma.user.count({
        where: whereConditions,
      }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
      data: result,
    };

  } catch (error) {
    console.error('Error fetching users:', error);
    throw new ApiError(500, "Failed to fetch users");
  }
};

// get user profile
const getMyProfile = async (userId: string) => {
  const userProfile = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  return userProfile;
};

//get user by id
const getUserById = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  if (!result) {
    throw new ApiError(404, "User not found");
  }
  return result;
};

// update profile by user won profile uisng token or email and id
const updateProfile = async (user: IUser, payload: User) => {
  const userInfo = await prisma.user.findUnique({
    where: {
      email: user.email,
      id: user.id,
    },
  });

  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }

  // Update the user profile with the new information
  const result = await prisma.user.update({
    where: {
      email: userInfo.email,
    },
    data: payload,
  });

  if (!result)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to update user profile"
    );

  return result;
};

// update user data into database by id fir admin
const updateUserIntoDb = async (payload: IUser, id: string) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      id: id,
    },
  });
  if (!userInfo)
    throw new ApiError(httpStatus.NOT_FOUND, "User not found with id: " + id);

  const result = await prisma.user.update({
    where: {
      id: userInfo.id,
    },
    data: payload,
  });

  if (!result)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to update user profile"
    );

  return result;
};

export const userService = {
  createUserIntoDb,
  getUsersFromDb,
  getUserById,
  updateProfile,
  updateUserIntoDb,
  getMyProfile,
};
