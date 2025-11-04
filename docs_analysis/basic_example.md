# Basic Example Pattern

From: https://lector-weld.vercel.app/docs/code/basic

## Key Pattern

```tsx
import { CanvasLayer, Page, Pages, Root, TextLayer } from "@anaralabs/lector";
import React from "react";
import "@/lib/setup";

const fileUrl = "/pdf/pathways.pdf";

const Basic = () => {
  return (
    <Root
      source={fileUrl}
      className='w-full h-[500px] border overflow-hidden rounded-lg'
      loader={<div className="p-4">Loading...</div>}
    >
      <Pages className='dark:invert-[94%] dark:hue-rotate-180 dark:brightness-[80%] dark:contrast-[228%]'>
        <Page>
          <CanvasLayer />
          <TextLayer />
        </Page>
      </Pages>
    </Root>
  );
};

export default Basic;
```

## Key Observations

1. **Root Component**: Wraps everything
2. **Pages Component**: Direct child of Root
3. **Page Component**: Inside Pages
4. **Layers**: CanvasLayer and TextLayer inside Page
5. **No Search wrapper** in basic example
