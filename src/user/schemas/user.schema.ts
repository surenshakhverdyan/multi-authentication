import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: false, unique: true })
  email: string;

  @Prop({ required: false, unique: true })
  phoneNumber: string;

  @Prop({ required: false })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: false })
  picture: string;

  @Prop({ required: false })
  provider: string;

  @Prop({ required: false })
  providerId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('validate', function (next) {
  if (!this.email && !this.phoneNumber) {
    this.invalidate('email', 'Either email or phone number is required');
    this.invalidate('phoneNumber', 'Either email or phone number is required');
  }

  next();
});
