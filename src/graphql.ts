/**
 * generateGraphQLSchema — builds a GraphQL SDL string from SDK TypeScript interfaces.
 *
 * Type mapping:
 *   bigint  → String  (GraphQL has no native 64-bit int)
 *   string  → String
 *   number  → Int
 *   boolean → Boolean
 */
export function generateGraphQLSchema(): string {
  return `
type Recipient {
  address: String!
  amount: String!
}

type Payment {
  payer: String!
  amount: String!
}

type Invoice {
  id: String!
  creator: String!
  recipients: [Recipient!]!
  token: String!
  deadline: Int!
  funded: String!
  status: String!
  payments: [Payment!]!
  recurring: Boolean
}

type Query {
  invoice(id: String!): Invoice
  invoicesByCreator(address: String!): [Invoice!]!
}
`.trim();
}
