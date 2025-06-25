export interface ApiResponses {
  success: boolean;
  data?: any;
  error?: any;
}

class CustomApiResponses {
  success = (data: any): ApiResponses => {
    return {
      success: true,
      data: data,
    };
  };

  error = (data: any): ApiResponses => {
    return {
      success: false,
      error: data,
    };
  };
}

export default new CustomApiResponses();
