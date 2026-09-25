import "server-only"

import type { Connection } from "oracledb"
import { oracledb } from "./oracle"
import type { AdminResource } from "./admin-data"

type Form = Record<string, unknown>
function string(value: unknown, label: string, max = 100) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new Error(`Enter a valid ${label}.`)
  return value.trim()
}
function id(value: unknown, label = "record") {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1)
    throw new Error(`Choose a valid ${label}.`)
  return value
}
function amount(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    throw new Error(`Enter a valid ${label}.`)
  return value
}
function localDate(value: unknown, time = false) {
  const text = string(value, "date", 20)
  if (
    !(time ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/).test(
      text
    )
  )
    throw new Error("Choose a valid Sri Lanka date and time.")
  return text
}
async function nextId(connection: Connection, sequence: string) {
  const result = await connection.execute<{ ID: number }>(
    `SELECT smartmove_database.${sequence}.NEXTVAL ID FROM dual`
  )
  if (!result.rows?.[0]) throw new Error("Could not assign an ID.")
  return result.rows[0].ID
}

export async function mutateAdminResource(
  connection: Connection,
  resource: AdminResource,
  method: string,
  form: Form
) {
  const recordId = method === "POST" ? null : id(form.id)
  if (resource === "routes") {
    const name = method === "DELETE" ? "" : string(form.name, "route name")
    const fare = method === "DELETE" ? 0 : amount(form.baseFare, "fare")
    if (method === "POST") {
      const created = await nextId(connection, "web_route_seq")
      await connection.execute(
        `BEGIN smartmove_database.add_route(:id,:name,:origin,:destination,:fare); END;`,
        {
          id: created,
          name,
          origin: string(form.origin, "origin", 50),
          destination: string(form.destination, "destination", 50),
          fare,
        }
      )
      return { id: created }
    }
    if (method === "PATCH")
      await connection.execute(
        `BEGIN smartmove_database.update_route(:id,:name,:fare); END;`,
        { id: recordId, name, fare }
      )
    if (method === "DELETE")
      await connection.execute(
        `BEGIN smartmove_database.delete_route(:id); END;`,
        { id: recordId }
      )
  } else if (resource === "vehicles") {
    if (method === "DELETE")
      await connection.execute(
        `BEGIN smartmove_database.delete_vehicle(:id); END;`,
        { id: recordId }
      )
    else {
      const registration = string(form.registrationNumber, "registration", 20)
      const vehicleType = string(form.vehicleType, "vehicle type", 20)
      const seats = id(form.seatCount, "seat count")
      if (method === "POST") {
        const created = await nextId(connection, "web_vehicle_seq")
        await connection.execute(
          `BEGIN smartmove_database.add_vehicle(:id,:registration,:vehicleType,:seats); END;`,
          { id: created, registration, vehicleType, seats }
        )
        return { id: created }
      }
      if (form.status !== "ACTIVE" && form.status !== "MAINTENANCE")
        throw new Error("Choose a vehicle status.")
      await connection.execute(
        `BEGIN smartmove_database.update_vehicle(:id,:registration,:vehicleType,:seats,:status); END;`,
        { id: recordId, registration, vehicleType, seats, status: form.status }
      )
    }
  } else if (resource === "drivers") {
    if (method === "DELETE")
      await connection.execute(
        `BEGIN smartmove_database.delete_driver(:id); END;`,
        { id: recordId }
      )
    else {
      const name = string(form.name, "driver name")
      const phone = string(form.phone, "phone", 15)
      const licence = string(form.licenceNumber, "licence number", 30)
      if (method === "POST") {
        const created = await nextId(connection, "web_driver_seq")
        await connection.execute(
          `BEGIN smartmove_database.add_driver(:id,:name,:phone,:licence); END;`,
          { id: created, name, phone, licence }
        )
        return { id: created }
      }
      await connection.execute(
        `BEGIN smartmove_database.update_driver(:id,:name,:phone,:licence); END;`,
        { id: recordId, name, phone, licence }
      )
    }
  } else if (resource === "trips") {
    if (method === "DELETE")
      await connection.execute(`BEGIN smartmove_database.delete_trip(:id); END;`, {
        id: recordId,
      })
    else {
      const vehicleId = id(form.vehicleId, "vehicle")
      const driverId = id(form.driverId, "driver")
      const departureAt = localDate(form.departureAt, true)
      const arrivalAt = localDate(form.arrivalAt, true)
      if (method === "POST") {
        const created = await nextId(connection, "web_trip_seq")
        await connection.execute(
          `BEGIN smartmove_database.schedule_trip(:id,:routeId,:vehicleId,:driverId,
          TO_DATE(:departureAt,'YYYY-MM-DD"T"HH24:MI'),TO_DATE(:arrivalAt,'YYYY-MM-DD"T"HH24:MI')); END;`,
          {
            id: created,
            routeId: id(form.routeId, "route"),
            vehicleId,
            driverId,
            departureAt,
            arrivalAt,
          }
        )
        return { id: created }
      }
      await connection.execute(
        `BEGIN smartmove_database.reschedule_trip(:id,:vehicleId,:driverId,
        TO_DATE(:departureAt,'YYYY-MM-DD"T"HH24:MI'),TO_DATE(:arrivalAt,'YYYY-MM-DD"T"HH24:MI')); END;`,
        { id: recordId, vehicleId, driverId, departureAt, arrivalAt }
      )
    }
  } else if (resource === "maintenance") {
    if (method === "DELETE")
      await connection.execute(
        `BEGIN smartmove_database.delete_maintenance(:id); END;`,
        { id: recordId }
      )
    else {
      const type = string(form.type, "maintenance type")
      const scheduledDate = localDate(form.scheduledDate)
      if (method === "POST") {
        const created = await nextId(connection, "web_maintenance_seq")
        await connection.execute(
          `BEGIN smartmove_database.schedule_maintenance(:id,:vehicleId,:type,TO_DATE(:scheduledDate,'YYYY-MM-DD')); END;`,
          {
            id: created,
            vehicleId: id(form.vehicleId, "vehicle"),
            type,
            scheduledDate,
          }
        )
        return { id: created }
      }
      await connection.execute(
        `BEGIN smartmove_database.update_maintenance(:id,:type,TO_DATE(:scheduledDate,'YYYY-MM-DD')); END;`,
        { id: recordId, type, scheduledDate }
      )
    }
  } else if (resource === "passengers" && method === "PATCH") {
    await connection.execute(
      `BEGIN smartmove_database.update_passenger(:id,:name,:phone); END;`,
      {
        id: recordId,
        name: string(form.name, "passenger name"),
        phone: string(form.phone, "phone", 15),
      }
    )
  } else throw new Error("This action is not available for this record.")
  return { id: recordId }
}

export async function runAdminAction(connection: Connection, input: Form) {
  const action = string(input.action, "action", 40)
  const bookingId =
    action.includes("booking") ||
    action === "record_payment" ||
    action === "record_refund"
      ? id(input.id, "booking")
      : null
  if (action === "record_payment") {
    if (!["CASH", "CARD", "BANK_TRANSFER"].includes(String(input.method)))
      throw new Error("Choose a payment method.")
    const result = await connection.execute(
      `BEGIN smartmove_database.web_admin_record_payment(:id,:method,:paymentId,:amount); END;`,
      {
        id: bookingId,
        method: String(input.method),
        paymentId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        amount: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    )
    return result.outBinds
  }
  if (action === "cancel_booking") {
    const result = await connection.execute(
      `BEGIN smartmove_database.web_admin_cancel_booking(:id,:changed,:refundAmount); END;`,
      {
        id: bookingId,
        changed: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        refundAmount: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    )
    return result.outBinds
  }
  if (action === "record_refund") {
    const result = await connection.execute(
      `BEGIN smartmove_database.web_admin_record_refund(:id,:changed,:amount); END;`,
      {
        id: bookingId,
        changed: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        amount: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    )
    return result.outBinds
  }
  if (action === "cancel_trip") {
    const result = await connection.execute(
      `BEGIN smartmove_database.web_admin_cancel_trip(:id,:changed,:refundCount); END;`,
      {
        id: id(input.id, "trip"),
        changed: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        refundCount: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    )
    return result.outBinds
  }
  if (action === "complete_trip") {
    await connection.execute(`BEGIN smartmove_database.complete_trip(:id); END;`, {
      id: id(input.id, "trip"),
    })
    return { completed: true }
  }
  if (action === "complete_maintenance") {
    const cost =
      input.cost === "" || input.cost == null ? 0 : Number(input.cost)
    if (!Number.isFinite(cost) || cost < 0)
      throw new Error("Enter a valid maintenance cost.")
    await connection.execute(
      `BEGIN smartmove_database.complete_maintenance(:id,:cost); END;`,
      { id: id(input.id, "maintenance"), cost }
    )
    return { completed: true }
  }
  throw new Error("Unknown admin action.")
}
