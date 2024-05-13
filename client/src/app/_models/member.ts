export interface Member {
    id: number;
    username: string;
    photoUrl: string;
    age: number;
    knownAs: string;
    created: Date;
    lastActive: Date;
    gender: string;
    lookingFor: string;
    interests: string;
    city: string;
    country: string;
    introduction: string;
    photos: Photo[];
  }
  
  export interface Photo {
    id: number;
    url: string;
    isMain: boolean;
  }