import { indexRoute } from './routes/index-route'
import { rootRoute } from './routes/root-route'
import { splatRoute } from './routes/splat-route'

export const routeTree = rootRoute.addChildren([indexRoute, splatRoute])
