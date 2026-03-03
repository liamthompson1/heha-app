export const CREATE_TRIP_MUTATION = `
  mutation CreateTrip($input: CreateTripInput!) {
    createTrip(input: $input) {
      id
      success
      error
    }
  }
`;
