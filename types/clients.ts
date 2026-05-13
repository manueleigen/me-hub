export type ClientStatus = "active" | "inactive" | "prospect";

export interface ClientFrontmatter {
  name: string;
  type?: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  hourlyRate?: number;
  status: ClientStatus;
  since?: string;
  notes?: string;
}

export interface Client extends ClientFrontmatter {
  slug: string;
  sha?: string;
}
