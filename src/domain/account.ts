import { Embeddable, Property } from '@mikro-orm/core';
import * as bcrypt from 'bcrypt';

@Embeddable()
export class Account {
  @Property()
  private _password: string;

  async setPassword(password: string) {
    const saltOrRounds = 8;
    this._password = await bcrypt.hash(password, saltOrRounds);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this._password);
  }
}
