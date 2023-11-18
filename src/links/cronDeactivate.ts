import { ScheduledEvent, ScheduledHandler } from 'aws-lambda'
import { deactivate } from '../dynamodb/links'

export const handler: ScheduledHandler = async (event: any) => {
    // Even though ScheduledEvent defines details property, which should contain variables, the event is totally
    // different when triggered by the Scheduler. It contains only linkId.
    const {linkId} = event
    await deactivate(linkId)
    // Intentionally not catching errors, as this is a cron job and errors should be thrown to make it retry
}
