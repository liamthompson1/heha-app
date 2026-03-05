export const CREATE_TRIP_MUTATION = `
  mutation CreateTrip($trip: TripInput!, $agentCode: String) {
    createTrip(trip: $trip, agentCode: $agentCode) {
      ... on Trip {
        id
        name
        from
        to
        departureIATA
        destinationIATA
      }
      ... on TripCreationError {
        message
      }
    }
  }
`;

export const GET_TRAVELLER_TRIPS_QUERY = `
  query GetTravellerTrips {
    getTraveller {
      upcomingTrips {
        id
        name
        from
        to
        departureIATA
        destinationIATA
        storedAt
        travellers {
          travellerCount
        }
        outboundOriginPostCode
      }
      pastTrips {
        id
        name
        from
        to
        departureIATA
        destinationIATA
        storedAt
        travellers {
          travellerCount
        }
        outboundOriginPostCode
      }
    }
  }
`;

export const EDIT_TRIP_MUTATION = `
  mutation EditTrip($tripId: String!, $fields: TripAmendment, $trip: TripInput) {
    editTrip(tripId: $tripId, fields: $fields, trip: $trip) {
      id
      name
      from
      to
      departureIATA
      destinationIATA
    }
  }
`;

export const ARCHIVE_TRIP_MUTATION = `
  mutation ArchiveTrip($tripId: String!) {
    archiveTrip(tripId: $tripId)
  }
`;

export const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      types {
        name
        kind
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
          args {
            name
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
        inputFields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  }
`;
