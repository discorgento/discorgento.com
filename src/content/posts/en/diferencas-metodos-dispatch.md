---
title: Differences between Dispatch() methods around, before, after
pubDate: 2023-09-03
description: Understand the differences between aroundDispatch(), beforeDispatch() and afterDispatch() methods in Magento 2 plugins.
tags: [magento, dispatch]
locale: en
author: mary
---

When comparing aroundDispatch() with beforeDispatch() and afterDispatch() in terms of performance, aroundDispatch() is usually the one that can have a slightly bigger impact, mainly because of the extra call to $proceed(). However, it is important to note that the performance difference between them is generally negligible and most likely won't be noticeable in most cases.

The difference between the three methods is mostly related to the behavior you want to add to your plugin:

aroundDispatch(): With aroundDispatch(), you can run logic before and/or after the original action, and you also have the ability to modify the result of the original action if needed. This flexibility makes aroundDispatch() very powerful, but it can also make the code more complex to implement correctly.

beforeDispatch(): beforeDispatch() is suitable when you need to perform actions before the original action runs. It lets you prepare the environment, set up values, or check conditions before the original action is executed.

afterDispatch(): afterDispatch() is suitable when you need to perform actions after the original action runs. It lets you run logic based on the result returned by the original action, or perform additional tasks once the action is done.

If the logic you want to add to your plugin needs to manipulate things both before and after the original action runs, aroundDispatch() is the natural choice. If your logic is strictly before or after the original execution, you can pick the matching method (beforeDispatch() or afterDispatch()) to keep the code clearer and more concise.

In general, the performance difference between these methods is small and should not be the main factor when deciding which one to use. The choice should be driven by the desired functionality, readability, and maintainability of your code. Your goal should be to write clear and efficient code that meets the specific needs of your module and the application as a whole.