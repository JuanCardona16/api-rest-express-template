import MongoHelpers from '@/infrastructure/mongoDb/lib/MongoHelpers';
import { CollectionsNamesMongo } from '../../Collections/Collections';
import UserMongoSchema from './User.schema';
import mongoose from 'mongoose';
import { User } from '@/features/user/model/User.model';

const UserModel = MongoHelpers.getDataCollectionModel<User>(
  CollectionsNamesMongo.USERS,
  UserMongoSchema
) satisfies mongoose.Model<User>; // 👉 "Asegúrate de que esto cumple con el tipo Model<User> de Mongoose"

export default UserModel;
