import { Expose } from 'class-transformer';

export class ResultAddressDto {
  @Expose()
  state: string;

  @Expose()
  municipality: string;

  @Expose()
  neighborhood: string;

  @Expose()
  typeOfRoad: string;

  @Expose()
  firstAddressField?: string;

  @Expose()
  secondAddressField?: string;

  @Expose()
  thirdAddressField?: string;

  @Expose()
  propertyType?: string;

  @Expose()
  namePropertyType?: string;

  @Expose()
  blockOrInterior?: string;

  @Expose()
  blockOrInteriorName?: string;

  @Expose()
  observation?: string;
}
