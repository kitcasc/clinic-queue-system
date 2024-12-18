import React from "react"
import { cn } from "../../lib/utils"

const Tab = {
  Group: ({ children }) => {
    return <div className="w-full">{children}</div>
  },
  List: ({ className, children }) => {
    return (
      <div className={cn("flex space-x-1 rounded-xl bg-blue-900/20 p-1", className)}>
        {children}
      </div>
    )
  },
  Panel: ({ className, children }) => {
    return (
      <div className={cn("rounded-xl bg-white p-3", className)}>
        {children}
      </div>
    )
  },
  Panels: ({ children }) => {
    return <div className="mt-2">{children}</div>
  }
}

export { Tab }